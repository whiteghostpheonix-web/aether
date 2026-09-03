use clap::Parser;
use log::info;
use std::error::Error;

mod network;

// Import P2PNode from network
use network::P2PNode;

#[derive(Parser, Debug)]
#[command(name = "aether")]
#[command(about = "Aether Blockchain Node - 100% Gas-Free")]
struct Args {
    #[arg(short, long, default_value = "0.0.0.0:8000")]
    address: String,
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
    info!("🌐 Starting P2P Network...");

    let mut p2p = P2PNode::new().await?;
    let peer_id = p2p.get_peer_id().clone();
    info!("🆔 Node ID: {}", peer_id);

    info!("✅ Aether node is running!");
    info!("💡 Press Ctrl+C to stop");

    if let Err(e) = p2p.start(&args.address).await {
        log::error!("P2P error: {}", e);
    }

    Ok(())
}
