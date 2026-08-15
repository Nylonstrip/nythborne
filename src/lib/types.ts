export type Visibility = 'hidden' | 'revealed' | 'public'
export type NationType = 'superpower' | 'city_state' | 'settlement' | 'pocket_nation'
export type DungeonDirection = 'north' | 'south' | 'east' | 'west'
export type RelicPowerSource = 'nythilian' | 'mechanical' | 'elemental' | 'unknown'
export type RuleCategory = 'nyth_mechanics' | 'relic_mechanics' | 'skills' | 'combat' | 'general'

export interface Nation {
  id: string
  name: string
  type: NationType
  description: string | null
  geography: string | null
  culture: string | null
  government: string | null
  religion: string | null
  known_nyths: number
  relic_count: number
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Dungeon {
  id: string
  name: string
  direction: DungeonDirection
  description: string | null
  history: string | null
  hazards: string | null
  known_relics: string | null
  difficulty: string | null
  discovered: boolean
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  title: string
  era: string | null
  order_index: number
  description: string | null
  nations_involved: string[] | null
  significance: string | null
  religious_interpretation: string | null
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Race {
  id: string
  name: string
  description: string | null
  traits: string | null
  nyth_compatibility: string | null
  relic_relationship: string | null
  native_nations: string[] | null
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Faction {
  id: string
  name: string
  description: string | null
  goals: string | null
  methods: string | null
  base_nation: string | null
  known_nyth_members: number
  known_relics_held: number
  alignment: string | null
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  name: string
  is_player_character: boolean
  nation_origin: string | null
  race: string | null
  wish: string
  manifestation_name: string
  manifestation_description: string | null
  crystalline_form: string | null
  personality_basis: string | null
  overuse_effects: string | null
  current_condition: string | null
  near_death_event: string | null
  background: string | null
  visibility: Visibility
  gm_notes: string | null
  // Progression / stats
  level: number
  mental: number
  resonance: number
  alignment: number
  unspent_points: number
  traits: string[]
  approval_status: 'pending' | 'approved' | 'rejected'
  avatar_url: string | null
  health: number
  max_health: number
  mana: number
  max_mana: number
  inventory: string[]
  created_at: string
  updated_at: string
}

export type Nyth = Character

export interface Relic {
  id: string
  name: string
  relic_number: number | null
  description: string | null
  ability: string
  power_source: RelicPowerSource
  power_cost: string | null
  self_harm_threshold: string | null
  current_owner: string | null
  current_location: string | null
  is_discovered: boolean
  origin: string | null
  known_history: string | null
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Rule {
  id: string
  title: string
  category: RuleCategory
  content: string
  examples: string | null
  order_index: number
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  description: string | null
  stat_requirement: string | null
  unlock_condition: string | null
  passive: boolean
  visibility: Visibility
  gm_notes: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  is_active: boolean
  current_session: number
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  campaign_id: string
  session_number: number
  title: string | null
  summary: string | null
  live_notes: string | null
  revealed_events: string[] | null
  revealed_relics: string[] | null
  revealed_nyths: string[] | null
  created_at: string
  updated_at: string
}
