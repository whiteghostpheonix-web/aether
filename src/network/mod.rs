//! AETHER P2P NETWORK
//! Modern libp2p with SwarmBuilder

use libp2p::{
    swarm::{NetworkBehaviour, Swarm},
    gossipsub::{self, IdentTopic},
    identify, PeerId,
    SwarmBuilder,
};
use libp2p::identity::Keypair;
use libp2p::tcp;
use libp2p::noise;
use libp2p::yamux;
use libp2p::core::upgrade;
use futures::StreamExt;
use std::error::Error;
use log::{info, debug, warn};

// ─── NETWORK BEHAVIOUR ──────────────────────────────────────
#[derive(NetworkBehaviour)]
pub struct AetherBehaviour {
    pub gossipsub: gossipsub::Behaviour,
    pub identify: identify::Behaviour,
}

impl AetherBehaviour {
    pub fn new(keypair: &Keypair) -> Result<Self, Box<dyn Error>> {
        // Gossipsub config
        let gossipsub_config = gossipsub::Config::default();
        let gossipsub = gossipsub::Behaviour::new(
            gossipsub::MessageAuthenticity::Signed(keypair.clone()),
            gossipsub_config,
        )?;

        // Identify
        let identify = identify::Behaviour::new(identify::Config::new(
            "aether/1.0.0".to_string(),
            keypair.public(),
        ));

        Ok(Self {
            gossipsub,
            identify,
        })
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

// ─── P2P NODE ──────────────────────────────────────────────
pub struct P2PNode {
    pub peer_id: PeerId,
    pub swarm: Swarm<AetherBehaviour>,
}

impl P2PNode {
    pub async fn new() -> Result<Self, Box<dyn Error>> {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());

        info!("🆔 Peer ID: {}", peer_id);

        // Build with modern SwarmBuilder
        let mut swarm = SwarmBuilder::with_existing_identity(keypair.clone())
            .with_tokio()
            .with_tcp(
                tcp::Config::default(),
                |_| noise::Config::new(&keypair).unwrap(),
                yamux::Config::default,
            )?
            .with_behaviour(|_| AetherBehaviour::new(&keypair).unwrap())?
            .build();

        // Subscribe to topics
        swarm.behaviour_mut().subscribe_topics();

        Ok(Self {
            peer_id,
            swarm,
        })
    }

    pub async fn start(&mut self, address: &str) -> Result<(), Box<dyn Error>> {
        let addr = address.parse()?;
        self.swarm.listen_on(addr)?;
        info!("🌐 Listening on: {}", address);

        loop {
            tokio::select! {
                event = self.swarm.next() => {
                    match event {
                        Some(libp2p::swarm::SwarmEvent::NewListenAddr { address, .. }) => {
                            info!("🔊 Listening on: {}", address);
                        }
                        Some(libp2p::swarm::SwarmEvent::ConnectionEstablished { peer_id, .. }) => {
                            info!("🔗 Connected to: {}", peer_id);
                        }
                        Some(libp2p::swarm::SwarmEvent::ConnectionClosed { peer_id, .. }) => {
                            info!("🔌 Disconnected: {}", peer_id);
                        }
                        Some(libp2p::swarm::SwarmEvent::Behaviour(event)) => {
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

    pub fn subscribe_topic(&mut self, topic: &str) -> Result<(), Box<dyn Error>> {
        let topic = IdentTopic::new(topic);
        self.swarm.behaviour_mut().gossipsub.subscribe(&topic)?;
        Ok(())
    }

    pub fn publish(&mut self, topic: &str, data: Vec<u8>) -> Result<(), Box<dyn Error>> {
        let topic = IdentTopic::new(topic);
        self.swarm.behaviour_mut().gossipsub.publish(topic, data)?;
        Ok(())
    }
}
