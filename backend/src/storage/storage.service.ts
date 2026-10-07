import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Wraps Supabase Storage. The service-role key never leaves the backend. */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET', 'documents');
  }

  /** Create the private bucket on first boot so setup is one less manual step. */
  async onModuleInit() {
    try {
      const { data } = await this.supabase.storage.getBucket(this.bucket);
      if (!data) {
        const { error } = await this.supabase.storage.createBucket(this.bucket, { public: false });
        if (error) throw error;
        this.logger.log(`Created storage bucket "${this.bucket}"`);
      }
    } catch (err) {
      this.logger.warn(`Could not verify storage bucket "${this.bucket}": ${(err as Error).message}`);
    }
  }

  async upload(path: string, file: Buffer, contentType: string) {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file, { contentType, upsert: false });
    if (error) throw new InternalServerErrorException(`File upload failed: ${error.message}`);
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage.from(this.bucket).download(path);
    if (error || !data) throw new Error(`File download failed: ${error?.message ?? 'empty file'}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async createSignedUrl(path: string, expiresInSeconds = 300) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new InternalServerErrorException('Could not create download link');
    return data.signedUrl;
  }

  async remove(path: string) {
    const { error } = await this.supabase.storage.from(this.bucket).remove([path]);
    if (error) this.logger.warn(`Could not delete ${path}: ${error.message}`);
  }
}
