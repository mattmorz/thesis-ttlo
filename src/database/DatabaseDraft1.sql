-- =============================================
-- Authentication & User Management
-- =============================================
CREATE TABLE "User" (
  "User_ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Email" VARCHAR(255) UNIQUE NOT NULL,
  "Password_Hash" VARCHAR(255) NOT NULL,
  "First_Name" VARCHAR(100) NOT NULL,
  "Last_Name" VARCHAR(100) NOT NULL,
  "Role" VARCHAR(50) CHECK (Role IN ('Admin', 'TTLO_Staff', 'Client')),
  "Is_Active" BOOLEAN DEFAULT true,
  "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "Last_Login" TIMESTAMP
);

-- =============================================
-- Client Forms Management
-- =============================================
CREATE TABLE "client_profile" (
  "client_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "User"("User_ID") ON DELETE CASCADE,
  -- Personal Information
  "first_name" VARCHAR(100) NOT NULL,
  "middle_name" VARCHAR(100),
  "last_name" VARCHAR(100) NOT NULL,
  "gender" VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  "birth_date" DATE,
  "citizenship" VARCHAR(100) NOT NULL,
  "contact_number" VARCHAR(20),
  "email" VARCHAR(255) NOT NULL,
  "mailing_address" TEXT,
  
  -- Company Information
  "company_name" VARCHAR(255),
  "company_address" TEXT,
  "company_email" VARCHAR(255),
  "occupation" VARCHAR(255),
  
  -- IP Background Information
  "has_research_output" BOOLEAN DEFAULT false,
  "research_output_status" VARCHAR(20) CHECK (research_output_status IN ('yes', 'submitted', null)),
  "has_inst_materials" BOOLEAN DEFAULT false,
  "inst_materials_status" VARCHAR(20) CHECK (inst_materials_status IN ('yes', 'ongoing', null)),
  "is_familiar_ra8293" BOOLEAN DEFAULT false,
  "has_ip_experience" BOOLEAN DEFAULT false,
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT "valid_contact" CHECK (
    contact_number IS NULL OR 
    contact_number ~ '^[0-9]{10,15}$'
  ),
  CONSTRAINT "valid_email" CHECK (
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT "valid_company_email" CHECK (
    company_email IS NULL OR 
    company_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);


CREATE TABLE "ip_disclosure" (
  "disclosure_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" UUID REFERENCES "client_profile"("client_id"),
  
  -- Applicants Information Section
  "email" VARCHAR(255) NOT NULL,
  "applicants" JSONB NOT NULL, -- Array of {name: string}
  "inventors" JSONB NOT NULL,  -- Array of {name: string}
  "ip_types" JSONB NOT NULL,   -- {copyright, patent, utilityModel, industrialDesign, trademark, tradeSecret, notSure}
  "other_ip_type" VARCHAR(255),
  "is_rightful_owner" BOOLEAN DEFAULT false,
  "authorized_representative" VARCHAR(255),
  
  -- Copyright Application Section
  "work_title" VARCHAR(255),
  "work_description" TEXT,
  "creation_date" DATE,
  
  -- Patent Application Section
  "technology_type" JSONB, -- {product, process, material, software}
  "technology_field" JSONB, -- {chemical, mechanical}
  "patent_title" VARCHAR(255),
  "problem_solved" TEXT,
  "prior_art_comparison" TEXT,
  "novelty_explanation" TEXT,
  "variations" TEXT,
  "final_product_usage" TEXT,
  "literature_references" TEXT,
  "own_publications" TEXT,
  
  -- Trade Secret Section
  "trade_secret_description" TEXT,
  "confidentiality_measures" TEXT,
  
  -- Trademark Application Section
  "trademark_name" VARCHAR(255),
  "trademark_description" TEXT,
  "translation" TEXT,
  "nice_classifications" TEXT[], -- Array of classification strings
  "business_type" JSONB, -- {company: boolean, soleProprietor: boolean}
  "legal_name" VARCHAR(255),
  
  -- Disclosure Confirmation Section
  "written_disclosures" JSONB, -- {past: boolean, planned: boolean, notApplicable: boolean}
  "oral_disclosures" JSONB,    -- {past: boolean, planned: boolean, notApplicable: boolean}
  "future_work" TEXT,
  "confirmation_declaration" BOOLEAN DEFAULT false,
  
  -- Metadata
  "status" VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT "valid_email" CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE "substantial_use" (
  "use_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "application_id" UUID REFERENCES "project_application"("project_id"),
  
  -- Research Title
  "research_title" VARCHAR(255) NOT NULL,
  
  -- Laboratory Facilities
  "lab_facilities" JSONB NOT NULL DEFAULT '{
    "experimental_apparatus": false,
    "lab_instruments": false,
    "data_analysis_tools": false,
    "technical_support": false,
    "farm_machine_shop": false,
    "specialized_software": {
      "enabled": false,
      "details": null
    },
    "other_facilities": {
      "enabled": false,
      "details": null
    }
  }',
  
  -- Funding Resources
  "funding_resources" JSONB NOT NULL DEFAULT '{
    "personal_funds": false,
    "grants_and_funding": false,
    "scholarships": false,
    "industry_partnerships": false,
    "institution_collaboration": false,
    "other_funding": {
      "enabled": false,
      "details": null
    }
  }',
  
  -- Additional Information
  "remarks" TEXT,
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- Signatures for Substantial Use
CREATE TABLE "substantial_use_signature" (
  "signature_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "use_id" UUID REFERENCES "substantial_use"("use_id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "signature" TEXT NOT NULL,
  "signature_file_path" TEXT,
  "date_signed" DATE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER update_substantial_use_timestamp
  BEFORE UPDATE ON "substantial_use"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Main Deed of Assignment Table
CREATE TABLE "deed_assignment" (
  "deed_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "application_id" UUID REFERENCES "project_application"("project_id"),
  
  -- Basic Information (from deed-assignment.tsx)
  "research_title" VARCHAR(255) NOT NULL,
  "creators" JSONB NOT NULL, -- Array of {name: string}
  "creator_address" TEXT NOT NULL,
  "assignor_name" VARCHAR(255) NOT NULL,
  "assignee_name" VARCHAR(255) DEFAULT 'CARAGA STATE UNIVERSITY',
  "assignee_representative" VARCHAR(255) DEFAULT 'ROLYN C. DAGUIL, Ph.D.',
  
  -- Royalty Agreement Section (from royalty-agreement.tsx)
  "royalty_terms" JSONB NOT NULL DEFAULT '{
    "policy_reference": "Section 7(d)(i) of CSU IP Policy",
    "directive_order": "DO No. 003, s. 2018 Section 7(c)(iv)",
    "conditions": {
      "contingent_on_commercialization": true,
      "continues_after_graduation": true,
      "expires_with_patent": true
    }
  }',
  
  -- Signatory Information (from signatory-section.tsx)
  "execution_date" JSONB NOT NULL DEFAULT '{
    "day": null,
    "month": null,
    "year": null
  }',
  "inventors" JSONB NOT NULL, -- Array of {name: string}
  "assignee_details" JSONB NOT NULL DEFAULT '{
    "id": "M98 – 009",
    "date": null,
    "place": "Butuan City"
  }',
  "assignor_details" JSONB NOT NULL DEFAULT '{
    "id": null,
    "date": null,
    "place": "Butuan City"
  }',
  
  -- Notary Information
  "notary_details" JSONB NOT NULL DEFAULT '{
    "doc_number": null,
    "page_number": null,
    "book_number": null,
    "series_year": null
  }',
  
  -- Metadata
  "status" VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'notarized', 'approved', 'rejected')),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER update_deed_assignment_timestamp
  BEFORE UPDATE ON "deed_assignment"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Project Management
-- =============================================
CREATE TABLE "project_application" (
  "project_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" UUID REFERENCES "client_profile"("client_id"),
  
  -- Basic Project Information
  "project_title" VARCHAR(255) NOT NULL,
  "inventors" JSONB NOT NULL, -- Array of {name: string}
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "project_type" VARCHAR(50) CHECK (project_type IN ('Research', 'Development', 'Consultation', 'Other')),
  "funding_source" VARCHAR(50) CHECK (funding_source IN ('DOST', 'PCAARRD', 'CSU-funded', 'Private', 'Other')),
  "field" VARCHAR(50) CHECK (field IN ('Chemical', 'Mechanical')),
  
  -- Form References (Optional UUIDs for each form type)
  "ip_disclosure_id" UUID REFERENCES "ip_disclosure"("disclosure_id"),
  "substantial_use_id" UUID REFERENCES "substantial_use"("use_id"),
  "deed_assignment_id" UUID REFERENCES "deed_assignment"("deed_id"),
  
  -- Document Management
  "documents" JSONB DEFAULT '[]', -- Array of {type: string, file_path: string, upload_date: timestamp}
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at
CREATE TRIGGER update_project_application_timestamp
  BEFORE UPDATE ON "project_application"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Project Tracking & Calendar
-- =============================================
CREATE TABLE "Calendar_Event" (
  "Event_ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Project_ID" UUID REFERENCES "Project_Application"("Project_ID"),
  "Title" VARCHAR(255) NOT NULL,
  "Description" TEXT,
  "Start_Time" TIMESTAMP NOT NULL,
  "End_Time" TIMESTAMP,
  "Tags" TEXT[] DEFAULT '{}',  -- Flexible event categorization
  "Color" VARCHAR(50),         -- For calendar visualization
  "Priority" VARCHAR(20) CHECK (Priority IN ('Low', 'Medium', 'High', 'Urgent')),
  "Location" TEXT,
  "Is_All_Day" BOOLEAN DEFAULT false,
  "Recurrence_Rule" TEXT,      -- For recurring events
  "Created_By" UUID REFERENCES "User"("User_ID"),
  "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "Updated_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Phases Table
CREATE TABLE "project_phase" (
  "phase_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id") ON DELETE CASCADE,
  
  -- Phase Information
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "progress" INTEGER CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
  "status" VARCHAR(20) CHECK (status IN ('pending', 'active', 'completed', 'blocked')) DEFAULT 'pending',
  "order_number" INTEGER NOT NULL,
  
  -- Timing
  "start_date" TIMESTAMP,
  "due_date" TIMESTAMP,
  "completed_date" TIMESTAMP,
  
  -- Access Control
  "assigned_users" UUID[] NOT NULL, -- Array of User_IDs who can edit this phase
  "created_by" UUID REFERENCES "user"("user_id"),
  
  -- Activity Tracking
  "activities" JSONB DEFAULT '[]', -- Array of {type, title, description, timestamp, user_id}
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT "unique_phase_order" UNIQUE ("project_id", "order_number"),
  CONSTRAINT "valid_dates" CHECK (
    (start_date IS NULL OR due_date IS NULL) OR
    (start_date <= due_date)
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_phase_timestamp
  BEFORE UPDATE ON "project_phase"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE "phase_document" (
  "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phase_id" UUID REFERENCES "project_phase"("phase_id") ON DELETE CASCADE,
  "project_id" UUID REFERENCES "project_application"("project_id"),
  
  -- Document Information
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) CHECK (type IN (
    'ip_disclosure',
    'substantial_use',
    'deed_assignment',
    'supporting_document',
    'technical_document',
    'form_output',
    'other'
  )),
  
  -- File Details
  "file_path" TEXT NOT NULL,
  "file_size" BIGINT,
  "file_type" VARCHAR(50),
  "original_filename" VARCHAR(255),
  
  -- Form Reference (if document is generated from a form)
  "form_reference" JSONB DEFAULT NULL, -- {form_type: string, form_id: UUID}
  
  -- Document Status
  "status" VARCHAR(50) CHECK (status IN (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'archived'
  )) DEFAULT 'draft',
  
  -- Access Control
  "uploaded_by" UUID REFERENCES "user"("user_id"),
  "visibility" VARCHAR(20) CHECK (visibility IN ('public', 'private', 'team')) DEFAULT 'team',
  
  -- Metadata
  "description" TEXT,
  "tags" TEXT[],
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT "valid_form_reference" CHECK (
    (type = 'form_output' AND form_reference IS NOT NULL) OR
    (type != 'form_output')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_phase_document_timestamp
  BEFORE UPDATE ON "phase_document"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

  
-- =============================================
-- Notifications & Activity Tracking
-- =============================================
CREATE TABLE "notification" (
  "notification_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source Information
  "source_type" VARCHAR(50) CHECK (source_type IN (
    'project_phase',
    'calendar_event',
    'document',
    'form_submission',
    'system_alert',
    'comment',
    'assignment'
  )) NOT NULL,
  "source_id" UUID NOT NULL, -- References various source tables
  
  -- Notification Content
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "priority" VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  "type" VARCHAR(50) CHECK (type IN (
    'phase_update',
    'deadline_reminder',
    'document_status',
    'form_status',
    'assignment_update',
    'comment_added',
    'system_notification'
  )) NOT NULL,
  
  -- Recipients
  "recipient_id" UUID REFERENCES "user"("user_id") NOT NULL,
  "recipient_role" INTEGER REFERENCES "role"("role_id"),
  
  -- Status Tracking
  "is_read" BOOLEAN DEFAULT false,
  "read_at" TIMESTAMP,
  "is_actionable" BOOLEAN DEFAULT false,
  "action_url" TEXT,
  "expires_at" TIMESTAMP,
  
  -- Metadata
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID REFERENCES "user"("user_id"),
  
  -- Constraints
  CONSTRAINT "valid_source_reference" CHECK (
    CASE source_type
      WHEN 'project_phase' THEN EXISTS (SELECT 1 FROM "project_phase" WHERE "phase_id" = source_id)
      WHEN 'calendar_event' THEN EXISTS (SELECT 1 FROM "calendar_event" WHERE "event_id" = source_id)
      WHEN 'document' THEN EXISTS (SELECT 1 FROM "document" WHERE "document_id" = source_id)
      WHEN 'form_submission' THEN EXISTS (SELECT 1 FROM "project_application" WHERE "project_id" = source_id)
      ELSE true -- For system_alert and other types
    END
  )
);

-- Index for faster queries
CREATE INDEX idx_notification_recipient ON "notification"("recipient_id", "is_read", "created_at");

-- =============================================
-- Project Inventory Management
-- =============================================
CREATE TABLE "inventory_type" (
  "type_id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) UNIQUE NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "project_inventory" (
  "inventory_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id"),
  "type_id" INTEGER REFERENCES "inventory_type"("type_id"),
  
  -- Project Details (from inventory schema)
  "client_id" UUID REFERENCES "client_profile"("client_id"),
  "project_title" VARCHAR(255) NOT NULL,
  "inventors" JSONB NOT NULL, -- Array of {name, role}
  "field" VARCHAR(50) CHECK (field IN ('Chemical', 'Mechanical')),
  "status" VARCHAR(50) CHECK (status IN (
    'For Application',
    'On-going Application',
    'Granted',
    'Other'
  )),
  "project_type" VARCHAR(50) CHECK (project_type IN (
    'Research',
    'Development',
    'Consultation',
    'Other'
  )),
  "funding_source" VARCHAR(50) CHECK (funding_source IN (
    'DOST',
    'PCAARRD',
    'CSU-funded',
    'Private',
    'Other'
  )),
  
  -- Timeline
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  
  -- References
  "current_phase_id" UUID REFERENCES "project_phase"("phase_id"),
  "latest_document_id" UUID REFERENCES "phase_document"("document_id"),
  
  -- Metadata
  "custom_fields" JSONB DEFAULT '{}',
  "created_by" UUID REFERENCES "user"("user_id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT "valid_date_range" CHECK (
    end_date IS NULL OR start_date <= end_date
  )
);

-- Index for filtering
CREATE INDEX idx_project_inventory_filter ON project_inventory(
  client_id,
  status,
  field,
  project_type,
  funding_source
);

-- =============================================
-- Archive Management
-- =============================================
CREATE TABLE "archive" (
  "archive_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID REFERENCES "project_application"("project_id"),
  "archive_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "archive_reason" TEXT,
  "archived_by" UUID REFERENCES "user"("user_id"),
  "status" VARCHAR(50) DEFAULT 'archived',
  
  -- Project State at Archive Time
  "project_state" JSONB NOT NULL, -- Snapshot of project_application
  "current_phase" VARCHAR(50),
  "completion_percentage" INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Metadata
  "tags" TEXT[],
  "notes" TEXT,
  "last_modified" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Archive Documents
CREATE TABLE "archive_document" (
  "document_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "archive_id" UUID REFERENCES "archive"("archive_id") ON DELETE CASCADE,
  "original_document_id" UUID,
  "document_type" VARCHAR(50),
  "file_path" TEXT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_size" BIGINT,
  "upload_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "description" TEXT,
  "metadata" JSONB
);

-- Archive Phase History
CREATE TABLE "archive_phase_history" (
  "history_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "archive_id" UUID REFERENCES "archive"("archive_id") ON DELETE CASCADE,
  "phase_id" UUID,
  "phase_name" VARCHAR(100) NOT NULL,
  "status" VARCHAR(50),
  "progress" INTEGER,
  "start_date" TIMESTAMP,
  "end_date" TIMESTAMP,
  "comments" TEXT,
  "activities" JSONB -- Array of historical activities
);

-- Archive Activity Log
CREATE TABLE "archive_activity_log" (
  "log_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "archive_id" UUID REFERENCES "archive"("archive_id") ON DELETE CASCADE,
  "activity_type" VARCHAR(50),
  "description" TEXT,
  "performed_by" UUID REFERENCES "user"("user_id"),
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "related_phase" UUID,
  "metadata" JSONB
);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_profile_updated_at
  BEFORE UPDATE ON "client_profile"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at
CREATE TRIGGER update_ip_disclosure_timestamp
  BEFORE UPDATE ON "ip_disclosure"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


