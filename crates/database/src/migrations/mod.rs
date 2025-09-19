//! 数据库迁移模块
//! 
//! 手动管理数据库迁移，因为sea-orm-migration在当前版本有兼容性问题

use sea_orm::{ConnectionTrait, DbErr};

/// 迁移器结构
pub struct Migrator;

impl Migrator {
    /// 运行所有迁移
    pub async fn up<C>(db: &C, _schema: Option<String>) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        // 启用外键约束
        db.execute_unprepared("PRAGMA foreign_keys = ON").await?;
        // 创建用户表
        Self::create_users_table(db).await?;
        
        // 创建项目表
        Self::create_projects_table(db).await?;
        
        // 创建需求文档表
        Self::create_requirement_documents_table(db).await?;
        
        // 创建LLM会话表
        Self::create_llm_sessions_table(db).await?;
        
        // 创建LLM对话表
        Self::create_llm_conversations_table(db).await?;
        
        // 创建任务表
        Self::create_tasks_table(db).await?;
        
        // 创建Agent表
        Self::create_agents_table(db).await?;
        
        // 创建Agent工作历史表
        Self::create_agent_work_history_table(db).await?;
        
        // 创建执行会话表
        Self::create_execution_sessions_table(db).await?;
        
        // 创建执行日志表
        Self::create_execution_logs_table(db).await?;
        
        // 创建冲突表
        Self::create_conflicts_table(db).await?;
        
        // 创建人工决策表
        Self::create_human_decisions_table(db).await?;
        
        // 创建领域事件表
        Self::create_domain_events_table(db).await?;
        
        // 创建事件发布日志表
        Self::create_event_publish_log_table(db).await?;
        
        // 创建代码审查表
        Self::create_code_reviews_table(db).await?;
        
        // 创建任务依赖表
        Self::create_task_dependencies_table(db).await?;
        
        // 创建Agent性能指标表
        Self::create_agent_performance_metrics_table(db).await?;
        
        Ok(())
    }
    
    /// 创建用户表
    async fn create_users_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                profile_data TEXT,
                settings TEXT,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                last_login_at TEXT
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建项目表
    async fn create_projects_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS projects (
                project_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                repository_url TEXT NOT NULL,
                main_branch TEXT NOT NULL DEFAULT 'main',
                workspace_path TEXT NOT NULL,
                technology_stack TEXT,
                coding_standards TEXT,
                git_settings TEXT,
                codebase_info TEXT,
                project_context TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                quality_standards TEXT,
                automation_config TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建需求文档表
    async fn create_requirement_documents_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS requirement_documents (
                document_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                document_type TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'medium',
                version TEXT NOT NULL DEFAULT '1.0',
                llm_processed BOOLEAN NOT NULL DEFAULT 0,
                structured_content TEXT,
                processing_session_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                processed_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_documents_project ON requirement_documents(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_documents_type ON requirement_documents(document_type)",
            "CREATE INDEX IF NOT EXISTS idx_documents_processed ON requirement_documents(llm_processed)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建LLM会话表
    async fn create_llm_sessions_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS llm_sessions (
                session_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                session_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                system_prompt TEXT,
                decomposition_prompt TEXT,
                allocation_prompt TEXT,
                result_data TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_llm_sessions_project ON llm_sessions(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_llm_sessions_type ON llm_sessions(session_type)",
            "CREATE INDEX IF NOT EXISTS idx_llm_sessions_status ON llm_sessions(status)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建LLM对话表
    async fn create_llm_conversations_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS llm_conversations (
                message_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                message_order INTEGER NOT NULL,
                token_count INTEGER,
                model_used TEXT,
                processing_time_ms INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES llm_sessions(session_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_conversations_session ON llm_conversations(session_id)",
            "CREATE INDEX IF NOT EXISTS idx_conversations_order ON llm_conversations(session_id, message_order)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建任务表
    async fn create_tasks_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS tasks (
                task_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                parent_task_id TEXT,
                llm_session_id TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                task_type TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'medium',
                required_capabilities TEXT,
                acceptance_criteria TEXT,
                estimated_hours INTEGER,
                assigned_agent_id TEXT,
                assignment_prompt TEXT,
                assigned_at TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                started_at TEXT,
                completed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                dependency_count INTEGER NOT NULL DEFAULT 0,
                blocking_tasks_count INTEGER NOT NULL DEFAULT 0,
                execution_result TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
                FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
                FOREIGN KEY (llm_session_id) REFERENCES llm_sessions(session_id) ON DELETE SET NULL
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建Agent表
    async fn create_agents_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS agents (
                agent_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                prompt_template TEXT NOT NULL,
                capabilities TEXT NOT NULL,
                config TEXT NOT NULL,
                git_config TEXT,
                status TEXT NOT NULL DEFAULT 'idle',
                current_task_id TEXT,
                total_tasks_completed INTEGER NOT NULL DEFAULT 0,
                success_rate REAL NOT NULL DEFAULT 0.0,
                average_completion_time INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_active_at TEXT NOT NULL,
                skill_profile TEXT,
                skill_assessments TEXT,
                performance_trend TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)",
            "CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents(capabilities)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建Agent工作历史表
    async fn create_agent_work_history_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS agent_work_history (
                history_id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                task_id TEXT NOT NULL,
                task_type TEXT NOT NULL,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                success BOOLEAN,
                completion_time_minutes INTEGER,
                quality_score REAL,
                work_details TEXT,
                technologies_used TEXT NOT NULL,
                error_message TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_work_history_agent ON agent_work_history(agent_id)",
            "CREATE INDEX IF NOT EXISTS idx_work_history_task ON agent_work_history(task_id)",
            "CREATE INDEX IF NOT EXISTS idx_work_history_completed ON agent_work_history(completed_at)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建执行会话表
    async fn create_execution_sessions_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS execution_sessions (
                session_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                git_branch TEXT NOT NULL,
                base_commit TEXT,
                final_commit TEXT,
                execution_config TEXT,
                timeout_minutes INTEGER NOT NULL DEFAULT 60,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                success BOOLEAN,
                result_data TEXT,
                error_message TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
                FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_execution_sessions_task ON execution_sessions(task_id)",
            "CREATE INDEX IF NOT EXISTS idx_execution_sessions_agent ON execution_sessions(agent_id)",
            "CREATE INDEX IF NOT EXISTS idx_execution_sessions_status ON execution_sessions(status)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建执行日志表
    async fn create_execution_logs_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS execution_logs (
                log_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                log_level TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                timestamp_ms INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES execution_sessions(session_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_execution_logs_session ON execution_logs(session_id)",
            "CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON execution_logs(log_level)",
            "CREATE INDEX IF NOT EXISTS idx_execution_logs_type ON execution_logs(event_type)",
            "CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs(timestamp_ms)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建冲突表
    async fn create_conflicts_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS conflicts (
                conflict_id TEXT PRIMARY KEY,
                conflict_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                related_entities TEXT NOT NULL,
                affected_tasks TEXT NOT NULL,
                affected_agents TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'detected',
                escalated_to_human BOOLEAN NOT NULL DEFAULT 0,
                assigned_user_id TEXT,
                resolution_strategy TEXT,
                resolution_note TEXT,
                auto_resolved BOOLEAN NOT NULL DEFAULT 0,
                detected_at TEXT NOT NULL,
                escalated_at TEXT,
                resolved_at TEXT,
                FOREIGN KEY (assigned_user_id) REFERENCES users(user_id) ON DELETE SET NULL
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_conflicts_type ON conflicts(conflict_type)",
            "CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts(severity)",
            "CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status)",
            "CREATE INDEX IF NOT EXISTS idx_conflicts_escalated ON conflicts(escalated_to_human)",
            "CREATE INDEX IF NOT EXISTS idx_conflicts_assigned ON conflicts(assigned_user_id)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建人工决策表
    async fn create_human_decisions_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS human_decisions (
                decision_id TEXT PRIMARY KEY,
                conflict_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                decision_type TEXT NOT NULL,
                decision_data TEXT,
                reasoning TEXT,
                affected_entities TEXT NOT NULL,
                follow_up_actions TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conflict_id) REFERENCES conflicts(conflict_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_human_decisions_conflict ON human_decisions(conflict_id)",
            "CREATE INDEX IF NOT EXISTS idx_human_decisions_user ON human_decisions(user_id)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建领域事件表
    async fn create_domain_events_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS domain_events (
                event_id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                aggregate_type TEXT NOT NULL,
                aggregate_id TEXT NOT NULL,
                event_data TEXT NOT NULL,
                event_version INTEGER NOT NULL DEFAULT 1,
                user_id TEXT,
                session_id TEXT,
                correlation_id TEXT,
                occurred_at TEXT NOT NULL,
                processed_at TEXT,
                is_processed BOOLEAN NOT NULL DEFAULT 0,
                processing_attempts INTEGER NOT NULL DEFAULT 0,
                error_message TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type)",
            "CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON domain_events(aggregate_type, aggregate_id)",
            "CREATE INDEX IF NOT EXISTS idx_domain_events_occurred ON domain_events(occurred_at)",
            "CREATE INDEX IF NOT EXISTS idx_domain_events_processed ON domain_events(is_processed)",
            "CREATE INDEX IF NOT EXISTS idx_domain_events_correlation ON domain_events(correlation_id)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建事件发布日志表
    async fn create_event_publish_log_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS event_publish_log (
                log_id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                subscriber_type TEXT NOT NULL,
                subscriber_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                attempts INTEGER NOT NULL DEFAULT 0,
                max_attempts INTEGER NOT NULL DEFAULT 3,
                response_data TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                sent_at TEXT,
                delivered_at TEXT,
                failed_at TEXT,
                FOREIGN KEY (event_id) REFERENCES domain_events(event_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_event_publish_event ON event_publish_log(event_id)",
            "CREATE INDEX IF NOT EXISTS idx_event_publish_status ON event_publish_log(status)",
            "CREATE INDEX IF NOT EXISTS idx_event_publish_subscriber ON event_publish_log(subscriber_type, subscriber_id)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建代码审查表
    async fn create_code_reviews_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS code_reviews (
                review_id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                execution_session_id TEXT NOT NULL,
                reviewer_agent_id TEXT NOT NULL,
                pull_request_url TEXT NOT NULL,
                source_branch TEXT NOT NULL,
                target_branch TEXT NOT NULL,
                review_comments TEXT NOT NULL,
                code_changes TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                decision TEXT,
                overall_comment TEXT,
                created_at TEXT NOT NULL,
                reviewed_at TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
                FOREIGN KEY (execution_session_id) REFERENCES execution_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_code_reviews_task ON code_reviews(task_id)",
            "CREATE INDEX IF NOT EXISTS idx_code_reviews_session ON code_reviews(execution_session_id)",
            "CREATE INDEX IF NOT EXISTS idx_code_reviews_reviewer ON code_reviews(reviewer_agent_id)",
            "CREATE INDEX IF NOT EXISTS idx_code_reviews_status ON code_reviews(status)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建任务依赖表
    async fn create_task_dependencies_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS task_dependencies (
                dependency_id TEXT PRIMARY KEY,
                parent_task_id TEXT NOT NULL,
                child_task_id TEXT NOT NULL,
                dependency_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
                FOREIGN KEY (child_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_task_deps_parent ON task_dependencies(parent_task_id)",
            "CREATE INDEX IF NOT EXISTS idx_task_deps_child ON task_dependencies(child_task_id)",
            "CREATE INDEX IF NOT EXISTS idx_task_deps_type ON task_dependencies(dependency_type)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 创建Agent性能指标表
    async fn create_agent_performance_metrics_table<C>(db: &C) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        let sql = r#"
            CREATE TABLE IF NOT EXISTS agent_performance_metrics (
                metrics_id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                period_start TEXT NOT NULL,
                period_end TEXT NOT NULL,
                tasks_completed INTEGER NOT NULL,
                tasks_successful INTEGER NOT NULL,
                avg_completion_time REAL NOT NULL,
                avg_code_quality REAL NOT NULL,
                skill_improvements TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
            )
        "#;
        
        db.execute_unprepared(sql).await?;
        
        // 创建索引
        let index_sql = vec![
            "CREATE INDEX IF NOT EXISTS idx_perf_metrics_agent ON agent_performance_metrics(agent_id)",
            "CREATE INDEX IF NOT EXISTS idx_perf_metrics_period ON agent_performance_metrics(period_start, period_end)",
        ];
        
        for sql in index_sql {
            db.execute_unprepared(sql).await?;
        }
        
        Ok(())
    }
    
    /// 检查迁移状态
    pub async fn status<C>(db: &C) -> Result<Vec<String>, DbErr>
    where
        C: ConnectionTrait,
    {
        // 简单检查表是否存在
        let check_sql = r#"
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN (
                'users', 'projects', 'requirement_documents', 'llm_sessions', 'llm_conversations', 'tasks',
                'agents', 'agent_work_history', 'execution_sessions', 'execution_logs',
                'conflicts', 'human_decisions', 'domain_events', 'event_publish_log',
                'code_reviews', 'task_dependencies', 'agent_performance_metrics'
            )
        "#;
        
        let result = db.query_all(sea_orm::Statement::from_string(
            sea_orm::DatabaseBackend::Sqlite,
            check_sql.to_string()
        )).await?;
        
        let mut tables = Vec::new();
        for row in result {
            if let Ok(name) = row.try_get::<String>("", "name") {
                tables.push(name);
            }
        }
        
        Ok(tables)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::{Database, ConnectionTrait};

    #[tokio::test]
    async fn test_migration() {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        
        // 运行迁移
        Migrator::up(&db, None).await.unwrap();
        
        // 检查迁移状态
        let tables = Migrator::status(&db).await.unwrap();
        assert!(tables.contains(&"users".to_string()));
        
        // 验证表结构
        let table_info = db.query_all(sea_orm::Statement::from_string(
            sea_orm::DatabaseBackend::Sqlite,
            "PRAGMA table_info(users)".to_string()
        )).await.unwrap();
        
        assert!(!table_info.is_empty(), "用户表应该有列定义");
    }
}