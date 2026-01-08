-- Fix SMS Sequences Schema Migration
-- This migration adds missing columns and fixes schema mismatches

-- Add is_active column to sms_sequences table
ALTER TABLE sms_sequences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Modify sms_sequence_steps table to match backend expectations
ALTER TABLE sms_sequence_steps 
ADD COLUMN IF NOT EXISTS delay_amount INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delay_unit VARCHAR(20) NOT NULL DEFAULT 'hours';

-- Remove old delay columns if they exist
ALTER TABLE sms_sequence_steps 
DROP COLUMN IF EXISTS delay_days,
DROP COLUMN IF EXISTS delay_hours,
DROP COLUMN IF EXISTS delay_minutes;