use libp2p::{
    swarm::{NetworkBehaviour, Swarm, SwarmEvent},
    gossipsub::{Gossipsub, GossipsubConfig, IdentTopic},
    identify::{Identify, IdentifyConfig},
    mdns::{Mdns, MdnsConfig},
    noise, tcp, yamux, PeerId, Transport,
};
use futures::StreamExt;

pub struct P2PNode {
    pub peer_id: PeerId,
    pub swarm: Swarm<AetherBehaviour>,
}

#[derive(NetworkBehaviour)]
pub struct AetherBehaviour {
    pub gossipsub: Gossipsub,
    pub identify: Identify,
    pub mdns: Mdns,
}

impl AetherBehaviour {
    pub fn new(peer_id: PeerId) -> Self {
        // Gossipsub config
        let mut config = GossipsubConfig::default();
        config.set_max_transmit_size(1024 * 1024); // 1MB

        let gossipsub = Gossipsub::new(
            "aether/1.0.0".to_string(),
            peer_id,
            config,
        ).unwrap();

        // Identify protocol
        let identify = Identify::new(IdentifyConfig::new(
            "aether/1.0.0".to_string(),
        ));

        // MDNS for local discovery
        let mdns = Mdns::new(MdnsConfig::default()).unwrap();

        Self {
            gossipsub,
            identify,
            mdns,
        }
    }

    pub fn subscribe_topics(&mut self) {
        let topics = vec!["blocks", "transactions", "consensus"];
        for topic in topics {
            let topic = IdentTopic::new(topic);
            self.gossipsub.subscribe(&topic).unwrap();
            println!("📡 Subscribed to topic: {}", topic.to_string());
        }
    }
}

impl P2PNode {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Generate keypair
        let keypair = libp2p::identity::ed25519::Keypair::generate();
        let peer_id = PeerId::from(keypair.public());

        println!("🆔 Peer ID: {}", peer_id);

        // Create transport
        let transport = libp2p::development_transport(keypair).await?;

        // Create behaviour
        let mut behaviour = AetherBehaviour::new(peer_id);
        behaviour.subscribe_topics();

        // Create swarm
        let swarm = Swarm::new(transport, behaviour, peer_id);

        Ok(Self { peer_id, swarm })
    }

    pub async fn start(&mut self, address: &str) -> Result<(), Box<dyn std::error::Error>> {
        let addr = address.parse()?;
        self.swarm.listen_on(addr)?;

        println!("🌐 Listening on: {}", address);

        loop {
            tokio::select! {
                event = self.swarm.next() => {
                    match event {
                        Some(SwarmEvent::NewListenAddr { address, .. }) => {
                            println!("🔊 Listening on: {}", address);
                        }
                        Some(SwarmEvent::ConnectionEstablished { peer_id, .. }) => {
                            println!("🔗 Connected to: {}", peer_id);
                        }
                        Some(SwarmEvent::ConnectionClosed { peer_id, .. }) => {
                            println!("🔌 Disconnected: {}", peer_id);
                        }
                        _ => {}
                    }
                }
            }
        }
    }
}
