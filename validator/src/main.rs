use clap::Parser;
use log::info;

#[derive(Parser, Debug)]
#[command(name = "aether-validator")]
#[command(about = "Aether Validator Node - 100% Gas-Free")]
struct Args {
    #[arg(short, long, default_value = "0.0.0.0:8000")]
    address: String,
    #[arg(long, default_value = "1000")]
    stake: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    let args = Args::parse();

    println!("");
    println!("╔══════════════════════════════════════════════════════════════════╗");
    println!("║     ⚡ AETHER VALIDATOR NODE v1.0                              ║");
    println!("║     ⛽ 100% GAS-FREE                                           ║");
    println!("╚══════════════════════════════════════════════════════════════════╝");
    println!("");

    info!("📍 Address: {}", args.address);
    info!("💰 Stake: {}", args.stake);
    info!("✅ Aether validator is running!");

    tokio::signal::ctrl_c().await?;
    info!("👋 Shutting down...");
    Ok(())
}
