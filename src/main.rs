use clap::Parser;
use log::info;
use std::error::Error;

mod network;

#[derive(Parser, Debug)]
#[command(name = "aether")]
#[command(about = "Aether Blockchain Node - 100% Gas-Free")]
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
async fn main() -> Result<(), Box<dyn Error>> {
    env_logger::init();
    let args = Args::parse();

    println!("");
    println!("╔══════════════════════════════════════════════════════════════════╗");
    println!("║     ⚡ AETHER BLOCKCHAIN NODE v1.0                             ║");
    println!("║     ⛽ 100% GAS-FREE                                           ║");
    println!("║     🌐 P2P NETWORK ENABLED                                    ║");
    println!("╚══════════════════════════════════════════════════════════════════╝");
    println!("");

    info!("📍 Address: {}", args.address);
    info!("💰 Stake: {}", args.stake);
    info!("🔐 Validator: {}", if args.validator { "YES" } else { "NO" });

    if let Some(bootstrap) = args.bootstrap {
        info!("🌐 Bootstrap peer: {}", bootstrap);
    }

    info!("🌐 Starting P2P Network...");

    // Start P2P node
    let mut p2p = network::P2PNode::new().await?;
    let peer_id = p2p.get_peer_id().clone();
    info!("🆔 Node ID: {}", peer_id);

    info!("✅ Aether node is running!");
    info!("💡 Press Ctrl+C to stop");

    // Run P2P node
    if let Err(e) = p2p.start(&args.address).await {
        log::error!("P2P error: {}", e);
    }

    Ok(())
}
