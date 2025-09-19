//! # TypeScript类型定义生成工具
//! 
//! 这个命令行工具用于生成多Agent系统的TypeScript类型定义，
//! 可以将Rust类型转换为TypeScript接口和类型定义。

use clap::{Arg, Command};
use codex_multi_agent::typescript::{TypeScriptGenerator, save_typescript_definitions, validate_typescript_output};
use std::process;

fn main() {
    let matches = Command::new("generate-ts")
        .version(env!("CARGO_PKG_VERSION"))
        .author("Codex Team")
        .about("生成多Agent系统的TypeScript类型定义")
        .arg(
            Arg::new("output")
                .short('o')
                .long("output")
                .value_name("FILE")
                .help("输出文件路径")
                .default_value("./types/multi-agent.d.ts")
        )
        .arg(
            Arg::new("module")
                .short('m')
                .long("module")
                .value_name("MODULE")
                .help("只生成指定模块的类型 (types, agent_management, project_management, llm_orchestration, events)")
        )
        .arg(
            Arg::new("validate")
                .short('v')
                .long("validate")
                .help("验证生成的TypeScript代码")
                .action(clap::ArgAction::SetTrue)
        )
        .arg(
            Arg::new("pretty")
                .short('p')
                .long("pretty")
                .help("格式化输出的代码")
                .action(clap::ArgAction::SetTrue)
        )
        .arg(
            Arg::new("watch")
                .short('w')
                .long("watch")
                .help("监视文件变化并自动重新生成")
                .action(clap::ArgAction::SetTrue)
        )
        .get_matches();

    let output_path = matches.get_one::<String>("output").unwrap();
    let module_filter = matches.get_one::<String>("module");
    let validate = matches.get_flag("validate");
    let pretty = matches.get_flag("pretty");
    let watch_mode = matches.get_flag("watch");

    // 检查typescript feature是否启用
    #[cfg(not(feature = "typescript"))]
    {
        eprintln!("错误: TypeScript生成功能未启用");
        eprintln!("请使用 --features typescript 重新编译此工具");
        process::exit(1);
    }

    #[cfg(feature = "typescript")]
    {
        if watch_mode {
            run_watch_mode(output_path, module_filter, validate, pretty);
        } else {
            run_single_generation(output_path, module_filter, validate, pretty);
        }
    }
}

#[cfg(feature = "typescript")]
fn run_single_generation(
    output_path: &str,
    module_filter: Option<&String>,
    validate: bool,
    pretty: bool,
) {
    println!("🚀 开始生成TypeScript类型定义...");

    let result = match module_filter {
        Some(module) => {
            println!("📦 生成模块: {}", module);
            TypeScriptGenerator::generate_module_types(module)
        }
        None => {
            println!("📦 生成所有模块");
            TypeScriptGenerator::generate_all_types()
        }
    };

    let mut content = match result {
        Ok(content) => content,
        Err(e) => {
            eprintln!("❌ 生成失败: {}", e);
            process::exit(1);
        }
    };

    // 格式化代码
    if pretty {
        println!("✨ 格式化代码...");
        content = format_typescript_code(&content);
    }

    // 验证生成的代码
    if validate {
        println!("🔍 验证生成的代码...");
        if let Err(e) = validate_typescript_output(&content) {
            eprintln!("❌ 验证失败: {}", e);
            process::exit(1);
        }
        println!("✅ 代码验证通过");
    }

    // 创建输出目录
    if let Some(parent) = std::path::Path::new(output_path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            eprintln!("❌ 创建输出目录失败: {}", e);
            process::exit(1);
        }
    }

    // 保存文件
    if let Err(e) = std::fs::write(output_path, &content) {
        eprintln!("❌ 保存文件失败: {}", e);
        process::exit(1);
    }

    println!("✅ TypeScript类型定义已生成到: {}", output_path);
    
    // 显示统计信息
    show_generation_stats(&content);
}

#[cfg(feature = "typescript")]
fn run_watch_mode(
    output_path: &str,
    module_filter: Option<&String>,
    validate: bool,
    pretty: bool,
) {
    use std::time::Duration;
    use std::thread;

    println!("👀 监视模式启动，按 Ctrl+C 退出...");
    
    let mut last_modified = get_source_modification_time();
    
    // 初始生成
    run_single_generation(output_path, module_filter, validate, pretty);
    
    loop {
        thread::sleep(Duration::from_secs(1));
        
        let current_modified = get_source_modification_time();
        if current_modified > last_modified {
            println!("🔄 检测到源文件变化，重新生成...");
            run_single_generation(output_path, module_filter, validate, pretty);
            last_modified = current_modified;
        }
    }
}

#[cfg(feature = "typescript")]
fn get_source_modification_time() -> std::time::SystemTime {
    use std::fs;
    use std::time::SystemTime;
    
    let source_dirs = ["src/types.rs", "src/agent_management.rs", "src/project_management.rs", 
                      "src/llm_orchestration.rs", "src/events.rs"];
    
    let mut latest = SystemTime::UNIX_EPOCH;
    
    for dir in &source_dirs {
        if let Ok(metadata) = fs::metadata(dir) {
            if let Ok(modified) = metadata.modified() {
                if modified > latest {
                    latest = modified;
                }
            }
        }
    }
    
    latest
}

#[cfg(feature = "typescript")]
fn format_typescript_code(content: &str) -> String {
    // 简单的代码格式化
    let mut formatted = String::new();
    let mut indent_level = 0;
    
    for line in content.lines() {
        let trimmed = line.trim();
        
        // 减少缩进
        if trimmed.starts_with('}') || trimmed.starts_with(']') {
            indent_level = indent_level.saturating_sub(1);
        }
        
        // 添加缩进
        if !trimmed.is_empty() {
            formatted.push_str(&"  ".repeat(indent_level));
            formatted.push_str(trimmed);
            formatted.push('\n');
        } else {
            formatted.push('\n');
        }
        
        // 增加缩进
        if trimmed.ends_with('{') || trimmed.ends_with('[') {
            indent_level += 1;
        }
    }
    
    formatted
}

#[cfg(feature = "typescript")]
fn show_generation_stats(content: &str) {
    let lines = content.lines().count();
    let interfaces = content.matches("export interface").count();
    let types = content.matches("export type").count();
    let enums = content.matches("export enum").count();
    let functions = content.matches("export function").count();
    
    println!("\n📊 生成统计:");
    println!("   总行数: {}", lines);
    println!("   接口数: {}", interfaces);
    println!("   类型数: {}", types);
    println!("   枚举数: {}", enums);
    println!("   函数数: {}", functions);
    
    let file_size = content.len();
    let size_kb = file_size as f64 / 1024.0;
    println!("   文件大小: {:.1} KB", size_kb);
}