//! 任务依赖仓储实现

use crate::{entities::task_dependency, DatabaseConnection, DatabaseError, Result};
use sea_orm::{EntityTrait, Set, ActiveModelTrait, ColumnTrait, QueryFilter, QueryOrder, PaginatorTrait};
use uuid::Uuid;

/// 任务依赖仓储
pub struct TaskDependencyRepository {
    db: DatabaseConnection,
}

/// 创建任务依赖的数据结构
#[derive(Debug, Clone)]
pub struct CreateTaskDependencyData {
    pub parent_task_id: Uuid,
    pub child_task_id: Uuid,
    pub dependency_type: String,
}

impl TaskDependencyRepository {
    /// 创建新的任务依赖仓储实例
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// 创建新的任务依赖
    pub async fn create(&self, dependency_data: CreateTaskDependencyData) -> Result<task_dependency::Model> {
        let now = chrono::Utc::now().into();
        let dependency_id = Uuid::new_v4();
        
        let dependency = task_dependency::ActiveModel {
            dependency_id: Set(dependency_id),
            parent_task_id: Set(dependency_data.parent_task_id),
            child_task_id: Set(dependency_data.child_task_id),
            dependency_type: Set(dependency_data.dependency_type),
            created_at: Set(now),
            ..Default::default()
        };
        
        let _result = task_dependency::Entity::insert(dependency).exec(&self.db).await?;
        
        task_dependency::Entity::find_by_id(dependency_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("TaskDependency", dependency_id))
    }
    
    /// 根据ID查找任务依赖
    pub async fn find_by_id(&self, dependency_id: Uuid) -> Result<Option<task_dependency::Model>> {
        task_dependency::Entity::find_by_id(dependency_id)
            .one(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据依赖任务ID查找所有依赖关系
    pub async fn find_dependencies_for_task(&self, task_id: Uuid) -> Result<Vec<task_dependency::Model>> {
        task_dependency::Entity::find()
            .filter(task_dependency::Column::ChildTaskId.eq(task_id))
            .order_by_asc(task_dependency::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据前置任务ID查找所有被阻塞的任务
    pub async fn find_blocked_tasks(&self, prerequisite_task_id: Uuid) -> Result<Vec<task_dependency::Model>> {
        task_dependency::Entity::find()
            .filter(task_dependency::Column::ParentTaskId.eq(prerequisite_task_id))
            .order_by_asc(task_dependency::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 根据依赖类型查找依赖关系
    pub async fn find_by_dependency_type(&self, dependency_type: &str) -> Result<Vec<task_dependency::Model>> {
        task_dependency::Entity::find()
            .filter(task_dependency::Column::DependencyType.eq(dependency_type))
            .order_by_desc(task_dependency::Column::CreatedAt)
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 检查两个任务之间是否存在依赖关系
    pub async fn exists_dependency(
        &self,
        dependent_task_id: Uuid,
        prerequisite_task_id: Uuid,
    ) -> Result<bool> {
        let count = task_dependency::Entity::find()
            .filter(task_dependency::Column::ChildTaskId.eq(dependent_task_id))
            .filter(task_dependency::Column::ParentTaskId.eq(prerequisite_task_id))
            .count(&self.db)
            .await?;
        
        Ok(count > 0)
    }
    
    /// 检查是否存在循环依赖
    pub async fn check_circular_dependency(
        &self,
        dependent_task_id: Uuid,
        prerequisite_task_id: Uuid,
    ) -> Result<bool> {
        // 简单的循环检查：检查是否prerequisite_task_id依赖于dependent_task_id
        self.exists_dependency(prerequisite_task_id, dependent_task_id).await
    }
    
    /// 获取任务的所有前置任务ID
    pub async fn get_prerequisite_task_ids(&self, task_id: Uuid) -> Result<Vec<Uuid>> {
        let dependencies = self.find_dependencies_for_task(task_id).await?;
        Ok(dependencies.into_iter().map(|d| d.parent_task_id).collect())
    }
    
    /// 获取任务的所有被阻塞任务ID
    pub async fn get_blocked_task_ids(&self, task_id: Uuid) -> Result<Vec<Uuid>> {
        let blocked = self.find_blocked_tasks(task_id).await?;
        Ok(blocked.into_iter().map(|d| d.child_task_id).collect())
    }
    
    /// 更新依赖描述
    pub async fn update_description(
        &self,
        dependency_id: Uuid,
        _description: String,
    ) -> Result<task_dependency::Model> {
        let dependency = task_dependency::Entity::find_by_id(dependency_id)
            .one(&self.db)
            .await?
            .ok_or_else(|| DatabaseError::entity_not_found("TaskDependency", dependency_id))?;
        
        let dependency: task_dependency::ActiveModel = dependency.into();
        // description 字段在新模型中已移除
        
        dependency.update(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
    
    /// 删除任务依赖
    pub async fn delete(&self, dependency_id: Uuid) -> Result<()> {
        task_dependency::Entity::delete_by_id(dependency_id)
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 删除任务的所有依赖关系
    pub async fn delete_all_dependencies_for_task(&self, task_id: Uuid) -> Result<()> {
        // 删除作为依赖任务的记录
        task_dependency::Entity::delete_many()
            .filter(task_dependency::Column::ChildTaskId.eq(task_id))
            .exec(&self.db)
            .await?;
        
        // 删除作为前置任务的记录
        task_dependency::Entity::delete_many()
            .filter(task_dependency::Column::ParentTaskId.eq(task_id))
            .exec(&self.db)
            .await?;
        
        Ok(())
    }
    
    /// 批量创建依赖关系
    pub async fn create_batch(&self, dependencies_data: Vec<CreateTaskDependencyData>) -> Result<Vec<task_dependency::Model>> {
        let now = chrono::Utc::now().into();
        let mut active_models = Vec::new();
        let mut dependency_ids = Vec::new();
        
        for dependency_data in dependencies_data {
            let dependency_id = Uuid::new_v4();
            dependency_ids.push(dependency_id);
            
            let dependency = task_dependency::ActiveModel {
                dependency_id: Set(dependency_id),
                parent_task_id: Set(dependency_data.parent_task_id),
                child_task_id: Set(dependency_data.child_task_id),
                dependency_type: Set(dependency_data.dependency_type),
                created_at: Set(now),
                ..Default::default()
            };
            
            active_models.push(dependency);
        }
        
        task_dependency::Entity::insert_many(active_models).exec(&self.db).await?;
        
        // 返回插入的记录
        task_dependency::Entity::find()
            .filter(task_dependency::Column::DependencyId.is_in(dependency_ids))
            .all(&self.db)
            .await
            .map_err(DatabaseError::from)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::migrations::Migrator;
    use sea_orm::Database;

    async fn setup_test_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    #[tokio::test]
    async fn test_create_task_dependency() {
        let db = setup_test_db().await;
        let repo = TaskDependencyRepository::new(db);
        
        let dependency_data = CreateTaskDependencyData {
            parent_task_id: Uuid::new_v4(),
            child_task_id: Uuid::new_v4(),
            dependency_type: "blocking".to_string(),
        };
        
        let dependency = repo.create(dependency_data).await.unwrap();
        
        assert_eq!(dependency.dependency_type, "blocking");
    }

    #[tokio::test]
    async fn test_find_dependencies_for_task() {
        let db = setup_test_db().await;
        let repo = TaskDependencyRepository::new(db.clone());
        
        let task_id = Uuid::new_v4();
        let prerequisite_id = Uuid::new_v4();
        
        let dependency_data = CreateTaskDependencyData {
            parent_task_id: prerequisite_id,
            child_task_id: task_id,
            dependency_type: "blocking".to_string(),
        };
        
        let _created_dependency = repo.create(dependency_data).await.unwrap();
        
        let dependencies = repo.find_dependencies_for_task(task_id).await.unwrap();
        assert_eq!(dependencies.len(), 1);
        assert_eq!(dependencies[0].child_task_id, task_id);
        assert_eq!(dependencies[0].parent_task_id, prerequisite_id);
    }

    #[tokio::test]
    async fn test_check_circular_dependency() {
        let db = setup_test_db().await;
        let repo = TaskDependencyRepository::new(db.clone());
        
        let task_a = Uuid::new_v4();
        let task_b = Uuid::new_v4();
        
        // 创建A依赖B
        let dependency_data = CreateTaskDependencyData {
            parent_task_id: task_b,
            child_task_id: task_a,
            dependency_type: "blocking".to_string(),
        };
        
        let _created_dependency = repo.create(dependency_data).await.unwrap();
        
        // 检查B依赖A是否会造成循环
        let has_cycle = repo.check_circular_dependency(task_b, task_a).await.unwrap();
        assert!(has_cycle);
        
        // 检查正常情况
        let task_c = Uuid::new_v4();
        let no_cycle = repo.check_circular_dependency(task_c, task_a).await.unwrap();
        assert!(!no_cycle);
    }

    #[tokio::test]
    async fn test_exists_dependency() {
        let db = setup_test_db().await;
        let repo = TaskDependencyRepository::new(db.clone());
        
        let task_a = Uuid::new_v4();
        let task_b = Uuid::new_v4();
        
        // 检查不存在的依赖
        let exists_before = repo.exists_dependency(task_a, task_b).await.unwrap();
        assert!(!exists_before);
        
        // 创建依赖
        let dependency_data = CreateTaskDependencyData {
            parent_task_id: task_b,
            child_task_id: task_a,
            dependency_type: "blocking".to_string(),
        };
        
        let _created_dependency = repo.create(dependency_data).await.unwrap();
        
        // 检查存在的依赖
        let exists_after = repo.exists_dependency(task_a, task_b).await.unwrap();
        assert!(exists_after);
    }
}