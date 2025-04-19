/*
  # Add location field to plants table

  1. Changes
    - Add location field to plants table to store indoor/outdoor status
    - Update existing plants table if it exists
    - Ensure field is properly typed for indoor/outdoor values

  2. Notes
    - Location will be stored as text field with 'Indoor' or 'Outdoor' values
    - Field is nullable to handle legacy data
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plants' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.plants ADD COLUMN location text;

    -- Add a comment to document the expected values
    COMMENT ON COLUMN public.plants.location IS 'Stores plant location: Indoor or Outdoor';
  END IF;
END $$;