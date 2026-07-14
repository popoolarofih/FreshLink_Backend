-- Add dietaryPreferences array column to buyer_profiles
ALTER TABLE "buyer_profiles" ADD COLUMN "dietaryPreferences" TEXT[] NOT NULL DEFAULT '{}';
