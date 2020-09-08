#![cfg(test)]

use super::*;
use crate::mock::*;

use frame_support::assert_ok;

/// This example uses Class, Properties, Schema and Entity structures
/// to describe the Staked podcast channel and its second episode.
/// See https://staked.libsyn.com/rss

#[test]
fn create_podcast_class_schema() {
    with_test_externalities(|| {
        fn common_text_prop() -> PropertyType {
            PropertyType::Text(200)
        }

        fn long_text_prop() -> PropertyType {
            PropertyType::Text(4000)
        }

        // Channel props:
        // ------------------------------------------

        let channel_props = vec![
            // 0
            Property {
                prop_type: common_text_prop(),
                required: true,
                name: b"atom:link".to_vec(),
                description: b"".to_vec(),
            },
            // 1
            Property {
                prop_type: common_text_prop(),
                required: true,
                name: b"title".to_vec(),
                description: b"".to_vec(),
            },
            // 2
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"pubDate".to_vec(),
                description: b"".to_vec(),
            },
            // 3
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"lastBuildDate".to_vec(),
                description: b"".to_vec(),
            },
            // 4
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"generator".to_vec(),
                description: b"".to_vec(),
            },
            // 5
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"link".to_vec(),
                description: b"".to_vec(),
            },
            // 6
            // Example: en-us
            Property {
                prop_type: PropertyType::Text(5),
                required: false,
                name: b"language".to_vec(),
                description: b"".to_vec(),
            },
            // 7
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"copyright".to_vec(),
                description: b"".to_vec(),
            },
            // 8
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"docs".to_vec(),
                description: b"".to_vec(),
            },
            // 9
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"managingEditor".to_vec(),
                description: b"".to_vec(),
            },
            // 10
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"image/url".to_vec(),
                description: b"".to_vec(),
            },
            // 11
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"image/title".to_vec(),
                description: b"".to_vec(),
            },
            // 12
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"image/link".to_vec(),
                description: b"".to_vec(),
            },
            // 13
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:summary".to_vec(),
                description: b"".to_vec(),
            },
            // 14
            // TODO this could be Internal prop.
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:author".to_vec(),
                description: b"".to_vec(),
            },
            // 15
            // TODO make this as a text vec?
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:keywords".to_vec(),
                description: b"".to_vec(),
            },
            // 16
            Property {
                prop_type: PropertyType::TextVec(10, 100),
                required: false,
                name: b"itunes:category".to_vec(),
                description: b"".to_vec(),
            },
            // 17
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:image".to_vec(),
                description: b"".to_vec(),
            },
            // 18
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:explicit".to_vec(),
                description: b"".to_vec(),
            },
            // 19
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:owner/itunes:name".to_vec(),
                description: b"".to_vec(),
            },
            // 20
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:owner/itunes:email".to_vec(),
                description: b"".to_vec(),
            },
            // 21
            Property {
                prop_type: PropertyType::Text(4000),
                required: false,
                name: b"description".to_vec(),
                description: b"".to_vec(),
            },
            // 22
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:subtitle".to_vec(),
                description: b"".to_vec(),
            },
            // 23
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:type".to_vec(),
                description: b"".to_vec(),
            },
        ];

        // Episode props
        // ------------------------------------------

        let episode_props = vec![
            // 0
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"title".to_vec(),
                description: b"".to_vec(),
            },
            // 1
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:title".to_vec(),
                description: b"".to_vec(),
            },
            // 2
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"pubDate".to_vec(),
                description: b"".to_vec(),
            },
            // 3
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"guid".to_vec(),
                description: b"".to_vec(),
            },
            // 4
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"link".to_vec(),
                description: b"".to_vec(),
            },
            // 5
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:image".to_vec(),
                description: b"".to_vec(),
            },
            // 6
            Property {
                prop_type: long_text_prop(),
                required: false,
                name: b"description".to_vec(),
                description: b"".to_vec(),
            },
            // 7
            Property {
                prop_type: long_text_prop(),
                required: false,
                name: b"content:encoded".to_vec(),
                description: b"".to_vec(),
            },
            // 8
            Property {
                prop_type: PropertyType::Text(50),
                required: false,
                name: b"enclosure/length".to_vec(),
                description: b"".to_vec(),
            },
            // 9
            Property {
                prop_type: PropertyType::Text(50),
                required: false,
                name: b"enclosure/type".to_vec(),
                description: b"".to_vec(),
            },
            // 10
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"enclosure/url".to_vec(),
                description: b"".to_vec(),
            },
            // 11
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:duration".to_vec(),
                description: b"".to_vec(),
            },
            // 12
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:explicit".to_vec(),
                description: b"".to_vec(),
            },
            // 13
            // TODO make this as a text vec?
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:keywords".to_vec(),
                description: b"".to_vec(),
            },
            // 14
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:subtitle".to_vec(),
                description: b"".to_vec(),
            },
            // 15
            Property {
                prop_type: long_text_prop(),
                required: false,
                name: b"itunes:summary".to_vec(),
                description: b"".to_vec(),
            },
            // 16
            Property {
                prop_type: PropertyType::Uint16,
                required: false,
                name: b"itunes:season".to_vec(),
                description: b"".to_vec(),
            },
            // 17
            Property {
                prop_type: PropertyType::Uint16,
                required: false,
                name: b"itunes:episode".to_vec(),
                description: b"".to_vec(),
            },
            // 18
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:episodeType".to_vec(),
                description: b"".to_vec(),
            },
            // 19
            // TODO this could be Internal prop.
            Property {
                prop_type: common_text_prop(),
                required: false,
                name: b"itunes:author".to_vec(),
                description: b"".to_vec(),
            },
        ];

        // Channel

        let channel_class_id = TestModule::next_class_id();
        assert_ok!(
            TestModule::create_class(b"PodcastChannel".to_vec(), b"A podcast channel".to_vec(),),
            channel_class_id
        );

        let channel_schema_id: u16 = 0;

        assert_ok!(
            TestModule::add_class_schema(channel_class_id, vec![], channel_props,),
            channel_schema_id
        );

        // Episodes:

        let episode_class_id = TestModule::next_class_id();
        assert_ok!(
            TestModule::create_class(b"PodcastEpisode".to_vec(), b"A podcast episode".to_vec(),),
            episode_class_id
        );

        let episode_schema_id: u16 = 0;

        assert_ok!(
            TestModule::add_class_schema(episode_class_id, vec![], episode_props,),
            episode_schema_id
        );

        let mut p = PropHelper::new();
        let channel_entity_id = TestModule::next_entity_id();

        assert_ok!(
            TestModule::create_entity(channel_class_id,),
            channel_entity_id
        );

        assert_ok!(
            TestModule::add_schema_support_to_entity(
                channel_entity_id,
                channel_schema_id,
                vec![
                    // 0
                    p.next_text_value(b"https://staked.libsyn.com/rss".to_vec()),
                    // 1
                    p.next_text_value(b"Staked".to_vec()),
                    // 2
                    p.next_text_value(b"Wed, 15 May 2019 20:36:20 +0000".to_vec()),
                    // 3
                    p.next_text_value(b"Fri, 23 Aug 2019 11:26:24 +0000".to_vec()),
                    // 4
                    p.next_text_value(b"Libsyn WebEngine 2.0".to_vec()),
                    // 5
                    p.next_text_value(b"https://twitter.com/staked_podcast".to_vec()),
                    // 6
                    p.next_text_value(b"en".to_vec()),
                    // 7
                    p.next_value(PropertyValue::None),
                    // 8
                    p.next_text_value(b"https://twitter.com/staked_podcast".to_vec()),
                    // 9
                    p.next_text_value(b"staked@jsgenesis.com (staked@jsgenesis.com)".to_vec()),
                    // 10
                    p.next_text_value(b"https://ssl-static.libsyn.com/p/assets/2/d/2/5/2d25eb5fa72739f7/iTunes_Cover.png".to_vec()),
                    // 11
                    p.next_text_value(b"Staked".to_vec()),
                    // 12
                    p.next_text_value(b"https://twitter.com/staked_podcast".to_vec()),
                    // 13
                    p.next_text_value(b"Exploring crypto and blockchain governance.".to_vec()),
                    // 14
                    p.next_text_value(b"Staked".to_vec()),
                    // 15
                    p.next_text_value(b"crypto,blockchain,governance,staking,bitcoin,ethereum".to_vec()),
                    // 16
                    p.next_value(PropertyValue::TextVec(vec![
                        b"Technology".to_vec(), 
                        b"Software How-To".to_vec()
                    ])),
                    // 17
                    p.next_text_value(b"https://ssl-static.libsyn.com/p/assets/2/d/2/5/2d25eb5fa72739f7/iTunes_Cover.png".to_vec()),
                    // 18
                    p.next_text_value(b"yes".to_vec()),
                    // 19
                    p.next_text_value(b"Martin Wessel-Berg".to_vec()),
                    // 20
                    p.next_text_value(b"staked@jsgenesis.com".to_vec()),
                    // 21
                    p.next_text_value(b"Exploring crypto and blockchain governance.".to_vec()),
                    // 22
                    p.next_text_value(b"Exploring crypto and blockchain governance.".to_vec()),
                    // 23
                    p.next_text_value(b"episodic".to_vec()),
                ]
            )
        );

        let episode_2_summary = b"<p>In July 2017, the SEC published a report following their <a href=\"https://www.sec.gov/litigation/investreport/34-81207.pdf\">investigation of the DAO</a>. This was significant as it was the first actionable statement from the SEC, giving some insight as to how they interpret this new asset class in light of existing securities laws.</p> <p>Staked is brought to you by Joystream - A user governed media platform.</p>".to_vec();

        p = PropHelper::new();
        let episode_2_entity_id = TestModule::next_entity_id();

        assert_ok!(
            TestModule::create_entity(episode_class_id,),
            episode_2_entity_id
        );

        assert_ok!(
            TestModule::add_schema_support_to_entity(
                episode_2_entity_id,
                episode_schema_id,
                vec![
                    // 0
                    p.next_text_value(b"Implications of the DAO Report for Crypto Governance".to_vec()),
                    // 1
                    p.next_text_value(b"Implications of the DAO Report for Crypto Governance".to_vec()),
                    // 2
                    p.next_text_value(b"Wed, 13 Mar 2019 11:20:33 +0000".to_vec()),
                    // 3
                    p.next_text_value(b"1bf862ba81ab4ee797526d98e09ad301".to_vec()),
                    // 4
                    p.next_text_value(b"http://staked.libsyn.com/implications-of-the-dao-report-for-crypto-governance".to_vec()),
                    // 5
                    p.next_text_value(b"https://ssl-static.libsyn.com/p/assets/2/d/2/5/2d25eb5fa72739f7/iTunes_Cover.png".to_vec()),
                    // 6
                    p.next_text_value(episode_2_summary.clone()),
                    // 7
                    p.next_text_value(episode_2_summary.clone()),
                    // 8
                    p.next_text_value(b"87444374".to_vec()),
                    // 9
                    p.next_text_value(b"audio/mpeg".to_vec()),
                    // 10
                    p.next_text_value(b"https://traffic.libsyn.com/secure/staked/Staked_-_Ep._2_final_cut.mp3?dest-id=1097396".to_vec()),
                    // 11
                    p.next_text_value(b"36:27".to_vec()),
                    // 12
                    p.next_text_value(b"yes".to_vec()),
                    // 13
                    p.next_text_value(b"governance,crypto,sec,securities,dao,bitcoin,blockchain,ethereum".to_vec()),
                    // 14
                    p.next_text_value(b"Part I in a series exploring decentralized governance and securities law".to_vec()),
                    // 15
                    p.next_text_value(episode_2_summary),
                    // 16
                    p.next_value(PropertyValue::Uint16(1)),
                    // 17
                    p.next_value(PropertyValue::Uint16(2)),
                    // 18
                    p.next_text_value(b"full".to_vec()),
                    // 19
                    p.next_text_value(b"Staked".to_vec()),
                ]
            )
        );
    })
}

struct PropHelper {
    prop_idx: u16,
}

impl PropHelper {
    fn new() -> PropHelper {
        PropHelper { prop_idx: 0 }
    }

    fn next_value(&mut self, value: PropertyValue) -> ClassPropertyValue {
        let value = ClassPropertyValue {
            in_class_index: self.prop_idx,
            value,
        };
        self.prop_idx += 1;
        value
    }

    fn next_text_value(&mut self, text: Vec<u8>) -> ClassPropertyValue {
        self.next_value(PropertyValue::Text(text))
    }
}
