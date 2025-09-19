//! 任务依赖实体模型

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 任务依赖实体模型
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "task_dependencies")]
pub struct Model {
    /// 依赖ID - 主键
    #[sea_orm(primary_key, auto_increment = false)]
    pub dependency_id: Uuid,
    
    /// 父任务ID（被依赖的任务）
    pub parent_task_id: Uuid,
    
    /// 子任务ID（依赖其他任务的任务）
    pub child_task_id: Uuid,
    
    /// 依赖类型
    pub dependency_type: String,
    
    /// 创建时间
    pub created_at: DateTimeWithTimeZone,
}

/// 任务依赖关联关系
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// 与父任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::ParentTaskId",
        to = "super::task::Column::TaskId"
    )]
    ParentTask,
    
    /// 与子任务的关联关系
    #[sea_orm(
        belongs_to = "super::task::Entity",
        from = "Column::ChildTaskId",
        to = "super::task::Column::TaskId"
    )]
    ChildTask,
}

/// 父任务关联实现
impl Related<super::task::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ParentTask.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

/// 依赖类型枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DependencyType {
    /// 阻塞依赖：必须等待父任务完成
    Blocking,
    /// 软依赖：建议等待但不强制
    Soft,
    /// 资源依赖：需要相同资源
    Resource,
}

impl std::fmt::Display for DependencyType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DependencyType::Blocking => write!(f, "blocking"),
            DependencyType::Soft => write!(f, "soft"),
            DependencyType::Resource => write!(f, "resource"),
        }
    }
}

impl From<String> for DependencyType {
    fn from(dep_type: String) -> Self {
        match dep_type.as_str() {
            "blocking" => DependencyType::Blocking,
            "soft" => DependencyType::Soft,
            "resource" => DependencyType::Resource,
            _ => DependencyType::Blocking,
        }
    }
}

/// TaskDependency实体的业务方法实现
impl Model {
    /// 检查是否为阻塞依赖
    pub fn is_blocking(&self) -> bool {
        matches!(
            DependencyType::from(self.dependency_type.clone()),
            DependencyType::Blocking | DependencyType::Resource
        )
    }

    /// 检查是否可以并行执行
    pub fn can_execute_in_parallel(&self) -> bool {
        matches!(
            DependencyType::from(self.dependency_type.clone()),
            DependencyType::Soft
        )
    }

    /// 获取依赖类型
    pub fn get_dependency_type(&self) -> DependencyType {
        DependencyType::from(self.dependency_type.clone())
    }

    /// 创建新的任务依赖
    pub fn new(
        parent_task_id: Uuid,
        child_task_id: Uuid,
        dependency_type: DependencyType,
    ) -> Self {
        let now = chrono::Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
        
        Self {
            dependency_id: Uuid::new_v4(),
            parent_task_id,
            child_task_id,
            dependency_type: dependency_type.to_string(),
            created_at: now,
        }
    }

    /// 检查是否形成循环依赖
    pub fn creates_cycle(&self, existing_dependencies: &[Model]) -> bool {
        // 简单的循环检测：检查是否存在从parent到child的路径
        self.has_path_from_to(existing_dependencies, self.child_task_id, self.parent_task_id)
    }

    /// 检查从一个任务到另一个任务是否存在路径
    fn has_path_from_to(&self, dependencies: &[Model], from: Uuid, to: Uuid) -> bool {
        if from == to {
            return true;
        }

        let children: Vec<Uuid> = dependencies
            .iter()
            .filter(|dep| dep.parent_task_id == from)
            .map(|dep| dep.child_task_id)
            .collect();

        for child in children {
            if self.has_path_from_to(dependencies, child, to) {
                return true;
            }
        }

        false
    }
}