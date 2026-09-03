//! AETHER P2P NETWORK - libp2p 0.53 compatible

use libp2p::{
    swarm::{NetworkBehaviour, Swarm, SwarmEvent},
    gossipsub::{self, IdentTopic},
    identify, PeerId, SwarmBuilder,
};
use libp2p::identity::Keypair;
use libp2p::tcp;
use libp2p::noise;
use libp2p::yamux;
use log::{info, debug, warn};
use std::error::Error;
use futures::StreamExt;

#[derive(NetworkBehaviour)]
pub struct AetherBehaviour {
    pub gossipsub: gossipsub::Behaviour,
    pub identify: identify::Behaviour,
}

impl AetherBehaviour {
    pub fn new(keypair: &Keypair) -> Result<Self, Box<dyn Error>> {
        let gossipsub_config = gossipsub::Config::default();
        let gossipsub = gossipsub::Behaviour::new(
            gossipsub::MessageAuthenticity::Signed(keypair.clone()),
            gossipsub_config,
        )?;

        let identify = identify::Behaviour::new(identify::Config::new(
            "aether/1.0.0".to_string(),
            keypair.public(),
        ));

        Ok(Self { gossipsub, identify })
    }

    pub fn subscribe_topics(&mut self) {
        let topics = vec!["blocks", "transactions", "consensus"];
        for topic in topics {
            let topic = IdentTopic::new(topic);
            if let Err(e) = self.gossipsub.subscribe(&topic) {
                warn!("Failed to subscribe: {}", e);
            } else {
                info!("📡 Subscribed to topic: {}", topic);
            }
        }
    }
}

pub struct P2PNode {
    pub peer_id: PeerId,
    pub swarm: Swarm<AetherBehaviour>,
}

impl P2PNode {
    pub async fn new() -> Result<Self, Box<dyn Error>> {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        info!("🆔 Peer ID: {}", peer_id);

        let mut behaviour = AetherBehaviour::new(&keypair)?;
        behaviour.subscribe_topics();

        // Modern SwarmBuilder - no manual transport chaining needed
        let swarm = SwarmBuilder::with_existing_identity(keypair)
            .with_tokio()
            .with_tcp(
                tcp::Config::default(),
                noise::Config::new,
                yamux::Config::default,
            )?
            .with_behaviour(|_| behaviour)?
            .with_swarm_config(|cfg| cfg)
            .build();

        Ok(Self { peer_id, swarm })
    }

    pub async fn start(&mut self, address: &str) -> Result<(), Box<dyn Error>> {
        let addr = address.parse()?;
        self.swarm.listen_on(addr)?;
        info!("🌐 Listening on: {}", address);

        loop {
            tokio::select! {
                event = self.swarm.next() => {
                    match event {
                        Some(SwarmEvent::NewListenAddr { address, .. }) => {
                            info!("🔊 Listening on: {}", address);
                        }
                        Some(SwarmEvent::ConnectionEstablished { peer_id, .. }) => {
                            info!("🔗 Connected to: {}", peer_id);
                        }
                        Some(SwarmEvent::ConnectionClosed { peer_id, .. }) => {
                            info!("🔌 Disconnected: {}", peer_id);
                        }
                        Some(SwarmEvent::Behaviour(event)) => {
                            debug!("📨 Event: {:?}", event);
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    pub fn get_peer_id(&self) -> &PeerId {
        &self.peer_id
    }
}

// Explicitly export P2PNode
