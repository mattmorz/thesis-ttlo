DROP INDEX "idx_form_submission_registry_source";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_form_submission_registry_source_type" ON "form_submission_registry" USING btree ("source_type" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_form_submission_registry_source_id" ON "form_submission_registry" USING btree ("source_id" uuid_ops);