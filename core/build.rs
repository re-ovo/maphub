use std::io::Result;

fn main() -> Result<()> {
    // 编译 Apollo proto 文件
    // prost-build 会自动处理所有依赖的 proto 文件并生成正确的模块引用
    prost_build::compile_protos(&["src/apollo/protos/map.proto"], &["src/apollo/protos/"])?;

    Ok(())
}
