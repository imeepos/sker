//! TaskDependency实体测试

use uuid::Uuid;
use chrono::{DateTime, FixedOffset};

use codex_database::entities::task_dependency::{
    Entity as TaskDependency, Model as TaskDependencyModel, ActiveModel as TaskDependencyActiveModel,
    DependencyType
};
use codex_database::entities::task_dependency::*;

/// 测试TaskDependency实体的创建
#[tokio::test]
async fn test_task_dependency_creation() {
    let dependency_id = Uuid::new_v4();
    let parent_task_id = Uuid::new_v4();
    let child_task_id = Uuid::new_v4();
    let now = DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
        .unwrap()
        .with_timezone(&FixedOffset::east_opt(0).unwrap());

    let dependency = TaskDependencyModel {
        dependency_id,
        parent_task_id,
        child_task_id,
        dependency_type: DependencyType::Blocking.to_string(),
        created_at: now,
    };

    assert_eq!(dependency.dependency_id, dependency_id);
    assert_eq!(dependency.parent_task_id, parent_task_id);
    assert_eq!(dependency.child_task_id, child_task_id);
    assert_eq!(dependency.dependency_type, "blocking");
}

/// 测试DependencyType枚举转换
#[test]
fn test_dependency_type_conversion() {
    assert_eq!(DependencyType::Blocking.to_string(), "blocking");
    assert_eq!(DependencyType::Soft.to_string(), "soft");
    assert_eq!(DependencyType::Resource.to_string(), "resource");

    assert_eq!(DependencyType::from("blocking".to_string()), DependencyType::Blocking);
    assert_eq!(DependencyType::from("soft".to_string()), DependencyType::Soft);
    assert_eq!(DependencyType::from("resource".to_string()), DependencyType::Resource);
    assert_eq!(DependencyType::from("invalid".to_string()), DependencyType::Blocking);
}

/// 测试依赖类型业务逻辑
#[test]
fn test_dependency_business_logic() {
    let dependency = TaskDependencyModel {
        dependency_id: Uuid::new_v4(),
        parent_task_id: Uuid::new_v4(),
        child_task_id: Uuid::new_v4(),
        dependency_type: DependencyType::Blocking.to_string(),
        created_at: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 测试阻塞依赖检查
    assert!(dependency.is_blocking());
    
    // 测试是否可以并行执行
    assert!(!dependency.can_execute_in_parallel());
}

/// 测试软依赖
#[test]
fn test_soft_dependency() {
    let dependency = TaskDependencyModel {
        dependency_id: Uuid::new_v4(),
        parent_task_id: Uuid::new_v4(),
        child_task_id: Uuid::new_v4(),
        dependency_type: DependencyType::Soft.to_string(),
        created_at: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 测试软依赖特性
    assert!(!dependency.is_blocking());
    assert!(dependency.can_execute_in_parallel());
}

/// 测试资源依赖
#[test]
fn test_resource_dependency() {
    let dependency = TaskDependencyModel {
        dependency_id: Uuid::new_v4(),
        parent_task_id: Uuid::new_v4(),
        child_task_id: Uuid::new_v4(),
        dependency_type: DependencyType::Resource.to_string(),
        created_at: DateTime::parse_from_rfc3339("2024-01-01T00:00:00Z")
            .unwrap()
            .with_timezone(&FixedOffset::east_opt(0).unwrap()),
    };

    // 测试资源依赖特性
    assert!(dependency.is_blocking());
    assert!(!dependency.can_execute_in_parallel());
}