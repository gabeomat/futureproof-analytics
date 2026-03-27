
-- Create a public storage bucket for chat uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-uploads', 'chat-uploads', true);

-- Allow anyone to upload files to the chat-uploads bucket
CREATE POLICY "Allow public uploads to chat-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-uploads');

-- Allow anyone to read files from the chat-uploads bucket
CREATE POLICY "Allow public reads from chat-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-uploads');
