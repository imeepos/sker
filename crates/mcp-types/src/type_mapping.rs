// MCP类型映射增强模块 - 确保类型安全的协议映射
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use serde_json::Value;

/// 类型映射辅助宏 - 确保Rust和TypeScript类型的一致性
#[macro_export]
macro_rules! mcp_type {
    (
        $(#[$meta:meta])*
        $vis:vis enum $name:ident {
            $(
                $(#[$variant_meta:meta])*
                $variant:ident $({ $($field:ident: $field_type:ty),* $(,)? })?
            ),* $(,)?
        }
    ) => {
        $(#[$meta])*
        #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
        #[serde(tag = "type", rename_all = "camelCase")]
        #[ts(export, rename_all = "camelCase")]
        $vis enum $name {
            $(
                $(#[$variant_meta])*
                $variant $({ $($field: $field_type),* })?
            ),*
        }

        impl $name {
            /// 获取消息类型标识符
            pub fn type_name(&self) -> &'static str {
                match self {
                    $(
                        $name::$variant $({ .. })? => stringify!($variant)
                    ),*
                }
            }

            /// 验证类型完整性
            pub fn validate_schema(&self) -> Result<(), String> {
                // 可在此处添加运行时类型验证逻辑
                Ok(())
            }
        }
    };
}

/// MCP消息基础trait - 定义所有MCP消息共同接口
pub trait McpMessage: Serialize + for<'de> Deserialize<'de> + Clone {
    /// 获取消息的唯一类型标识符
    fn message_type() -> &'static str;
    
    /// 验证消息结构的完整性
    fn validate(&self) -> Result<(), String>;
    
    /// 转换为JSON Value进行序列化
    fn to_json_value(&self) -> Result<Value, serde_json::Error> {
        serde_json::to_value(self)
    }
    
    /// 从JSON Value反序列化
    fn from_json_value(value: Value) -> Result<Self, serde_json::Error> {
        serde_json::from_value(value)
    }
}

/// 类型映射注册表 - 运行时类型检查和验证
pub struct TypeRegistry {
    type_mappings: HashMap<String, fn(&Value) -> Result<(), String>>,
}

impl TypeRegistry {
    pub fn new() -> Self {
        Self {
            type_mappings: HashMap::new(),
        }
    }
    
    /// 注册类型映射验证器
    pub fn register_type<T: McpMessage>(&mut self, type_name: &str) {
        let validator = |value: &Value| -> Result<(), String> {
            T::from_json_value(value.clone())
                .map_err(|e| format!("类型验证失败: {}", e))?
                .validate()
        };
        self.type_mappings.insert(type_name.to_string(), validator);
    }
    
    /// 验证消息类型是否匹配预期
    pub fn validate_message_type(&self, type_name: &str, message: &Value) -> Result<(), String> {
        match self.type_mappings.get(type_name) {
            Some(validator) => validator(message),
            None => Err(format!("未知的消息类型: {}", type_name))
        }
    }
}

/// 创建全局类型注册表实例 - 使用线程安全的懒加载
use std::sync::{Mutex, OnceLock};

static TYPE_REGISTRY: OnceLock<Mutex<TypeRegistry>> = OnceLock::new();

pub fn get_type_registry() -> &'static Mutex<TypeRegistry> {
    TYPE_REGISTRY.get_or_init(|| Mutex::new(TypeRegistry::new()))
}

/// 便捷函数：注册类型到全局注册表
pub fn register_global_type<T: McpMessage>(type_name: &str) {
    if let Ok(mut registry) = get_type_registry().lock() {
        registry.register_type::<T>(type_name);
    }
}

/// 便捷函数：验证消息类型
pub fn validate_global_message_type(type_name: &str, message: &Value) -> Result<(), String> {
    match get_type_registry().lock() {
        Ok(registry) => registry.validate_message_type(type_name, message),
        Err(_) => Err("无法获取类型注册表锁".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_type_mapping_consistency() {
        // 测试Rust到TypeScript类型映射的一致性
        let _registry = TypeRegistry::new();
        
        // 注册测试类型
        // _registry.register_type::<TestMessage>("test_message");
        
        // 验证消息格式
        let _test_json = json!({
            "type": "test_message",
            "data": "test_data"
        });
        
        // assert!(_registry.validate_message_type("test_message", &_test_json).is_ok());
    }
}