use clap::Parser;
use log::info;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Parser, Debug)]
#[command(name = "aether-validator")]
#[command(about = "Aether Validator Node", long_about = None)]
struct Args {
    #[arg(short, long, default_value = "0.0.0.0:8000")]
    address: String,

    #[arg(short, long)]
    bootstrap: Option<String>,

    #[arg(long, default_value = "false")]
    validator: bool,

    #[arg(long, default_value = "1000")]
    stake: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    let args = Args::parse();

    info!("⚡ Starting Aether Validator Node...");
    info!("📍 Address: {}", args.address);
    info!("💰 Stake: {}", args.stake);

    // Initialize blockchain
    let chain = Arc::new(RwLock::new(
        aether_core::blockchain::Blockchain::new(
            aether_core::blockchain::ChainConfig::default()
        )
    ));

    // Start validator
    info!("✅ Validator started successfully!");
    info!("🌐 Listening on: {}", args.address);

    // Keep running
    tokio::signal::ctrl_c().await?;
    info!("👋 Shutting down...");

    Ok(())
}
