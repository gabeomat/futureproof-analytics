-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-uploads';

-- Drop public policies
DROP POLICY IF EXISTS "Allow public uploads to chat-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from chat-uploads" ON storage.objects;

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload to chat-uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

-- Authenticated users can read
CREATE POLICY "Authenticated users can read chat-uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-uploads');

-- Authenticated users can delete from chat-uploads
CREATE POLICY "Authenticated users can delete from chat-uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-uploads');