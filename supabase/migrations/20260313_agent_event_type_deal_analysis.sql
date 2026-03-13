-- Add deal_analysis value to agent_event_type enum
ALTER TYPE agent_event_type ADD VALUE IF NOT EXISTS 'deal_analysis';
