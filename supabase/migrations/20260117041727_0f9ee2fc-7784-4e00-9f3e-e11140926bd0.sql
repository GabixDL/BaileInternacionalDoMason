-- Create storage bucket for dinner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dinner-images', 'dinner-images', true);

-- Allow anyone to view dinner images (public bucket)
CREATE POLICY "Dinner images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'dinner-images');

-- Allow authenticated users to upload dinner images
CREATE POLICY "Anyone can upload dinner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dinner-images');

-- Allow anyone to update dinner images
CREATE POLICY "Anyone can update dinner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'dinner-images');

-- Allow anyone to delete dinner images
CREATE POLICY "Anyone can delete dinner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'dinner-images');