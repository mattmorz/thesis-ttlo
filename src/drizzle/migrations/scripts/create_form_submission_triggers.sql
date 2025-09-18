-- Trigger function to process form submissions and create IP applications
CREATE OR REPLACE FUNCTION process_form_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_title VARCHAR(255);
  v_description TEXT;
  v_inventors TEXT[];
  v_ip_type APPLICATION_TYPE;
  v_applicants JSONB;
  v_app_id UUID;
  v_source_id UUID;
  v_source_type TEXT;
  v_applicant_name TEXT;
  v_activity_title TEXT;
BEGIN
  -- Only process submissions that have been marked as submitted but not processed
  IF (NEW.status = 'submitted' AND (NEW.ipApplicationId IS NULL)) THEN
    -- Set status to processing
    UPDATE form_submission_registry
    SET status = 'pending_review', 
        updatedAt = CURRENT_TIMESTAMP
    WHERE registryId = NEW.registryId;
    
    -- Store variables for easier access
    v_source_id := NEW.sourceId;
    v_source_type := NEW.sourceType::TEXT;
    
    -- Extract data based on source type
    CASE NEW.sourceType
      WHEN 'ip_disclosure' THEN
        -- Extract title and other metadata from the ipDisclosure table
        -- and related tables based on the selected IP types
        BEGIN
          -- First try to get title from trademark application if it exists
          SELECT tm.trademarkName, COALESCE(tm.description, 'Trademark application') 
          INTO v_title, v_description
          FROM trademark_application tm
          WHERE tm.disclosureId = v_source_id
          LIMIT 1;
          
          IF v_title IS NULL THEN
            -- Try to get from patent application if no trademark
            SELECT pa.title, COALESCE(pa.problem, 'Patent/utility model application') 
            INTO v_title, v_description
            FROM patent_utility_model_application pa
            WHERE pa.disclosureId = v_source_id
            LIMIT 1;
          END IF;
          
          IF v_title IS NULL THEN
            -- Try to get from copyright application if no patent
            SELECT ca.workTitle, COALESCE(ca.workDescription, 'Copyright application') 
            INTO v_title, v_description
            FROM copyright_basic_application ca
            WHERE ca.disclosureId = v_source_id
            LIMIT 1;
          END IF;
          
          -- Default if no specific IP application found
          IF v_title IS NULL THEN
            v_title := 'IP Disclosure - ' || v_source_id;
            v_description := 'IP disclosure form submission';
          END IF;
        END;
        
        -- Get inventors/creators from IP disclosure inventors
        SELECT ARRAY_AGG(CONCAT(i.firstName, ' ', i.lastName))
        INTO v_inventors
        FROM ip_disclosure_inventor i
        WHERE i.disclosureId = v_source_id;
        
        -- Get applicants
        SELECT jsonb_agg(jsonb_build_object(
          'name', CONCAT(a.firstName, ' ', a.lastName),
          'role', 'applicant'
        ))
        INTO v_applicants
        FROM ip_disclosure_applicant a
        WHERE a.disclosureId = v_source_id;
        
        -- Determine IP type from the application types in ip_disclosure
        SELECT CASE 
          WHEN EXISTS (SELECT 1 FROM trademark_application WHERE disclosureId = v_source_id) THEN 'trademark'::APPLICATION_TYPE
          WHEN EXISTS (SELECT 1 FROM patent_utility_model_application WHERE disclosureId = v_source_id) THEN 'patent'::APPLICATION_TYPE
          WHEN EXISTS (SELECT 1 FROM copyright_basic_application WHERE disclosureId = v_source_id) THEN 'copyright'::APPLICATION_TYPE
          ELSE 'patent'::APPLICATION_TYPE -- Default to patent if no specific application
        END INTO v_ip_type;
      
      WHEN 'substantial_use' THEN
        -- Extract data from substantial use certificate
        SELECT su.researchTitle, 'Substantial Use Certificate' 
        INTO v_title, v_description
        FROM substantial_use su
        WHERE su.substantialUseId = v_source_id;
        
        -- Get applicants from substantial use
        SELECT su.applicants
        INTO v_applicants
        FROM substantial_use su
        WHERE su.substantialUseId = v_source_id;
        
        -- For substantial use, treat as patent type by default
        v_ip_type := 'patent'::APPLICATION_TYPE;
      
      WHEN 'deed_of_assignment' THEN
        -- Extract data from deed of assignment
        SELECT da.researchTitle, 'Deed of Assignment'
        INTO v_title, v_description
        FROM deed_of_assignment da
        WHERE da.deedId = v_source_id;
        
        -- Get creators from deed of assignment
        SELECT da.creators
        INTO v_applicants
        FROM deed_of_assignment da
        WHERE da.deedId = v_source_id;
        
        -- Extract creators as inventors
        SELECT ARRAY(
          SELECT elem->>'name' 
          FROM deed_of_assignment da, jsonb_array_elements(da.creators) AS elem
          WHERE da.deedId = v_source_id
        ) INTO v_inventors;
        
        -- For deed of assignment, determine type based on content if possible, default to patent
        v_ip_type := 'patent'::APPLICATION_TYPE;
        
      WHEN 'client_profile' THEN
        -- Extract data from client profile
        SELECT 
          CONCAT(cp.firstName, ' ', cp.lastName, ' - IP Application'), 
          CONCAT('IP application for client: ', cp.firstName, ' ', cp.lastName)
        INTO v_title, v_description
        FROM client_profile cp
        WHERE cp.clientId = v_source_id;
        
        -- Set client name as inventor
        SELECT ARRAY[CONCAT(cp.firstName, ' ', cp.lastName)]
        INTO v_inventors
        FROM client_profile cp
        WHERE cp.clientId = v_source_id;
        
        -- Set default applicants
        SELECT jsonb_build_array(jsonb_build_object(
          'name', CONCAT(cp.firstName, ' ', cp.lastName),
          'role', 'applicant'
        ))
        INTO v_applicants
        FROM client_profile cp
        WHERE cp.clientId = v_source_id;
        
        -- Default to patent type
        v_ip_type := 'patent'::APPLICATION_TYPE;
        
      ELSE
        -- Default values for other document types
        v_title := COALESCE(NEW.title, 'IP Application');
        v_description := COALESCE(NEW.description, 'Generated from document submission');
        v_ip_type := 'patent'::APPLICATION_TYPE;
        
        -- Attempt to get creators from other sources
        v_inventors := ARRAY['Unknown Inventor'];
        v_applicants := jsonb_build_array(jsonb_build_object(
          'name', 'Unknown Applicant',
          'role', 'applicant'
        ));
    END CASE;
    
    -- Use values from registry if provided
    IF NEW.title IS NOT NULL THEN
      v_title := NEW.title;
    END IF;
    
    IF NEW.description IS NOT NULL THEN
      v_description := NEW.description;
    END IF;
    
    IF NEW.inventorsCreators IS NOT NULL THEN
      -- Extract inventor names from JSON if available
      SELECT ARRAY(
        SELECT elem->>'name' 
        FROM jsonb_array_elements(NEW.inventorsCreators) AS elem
      ) INTO v_inventors;
    END IF;
    
    IF NEW.applicants IS NOT NULL THEN
      v_applicants := NEW.applicants;
    END IF;
    
    -- Create new IP application
    INSERT INTO ip_application (
      id,
      userId, 
      title, 
      description, 
      ipType, 
      status,
      inventors,
      createdAt, 
      updatedAt
    )
    VALUES (
      gen_random_uuid(),
      NEW.userId,
      v_title,
      v_description,
      v_ip_type,
      'pending',
      COALESCE(v_inventors, ARRAY[]::TEXT[]),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_app_id;
    
    -- Add contributors if we have inventor information
    IF v_inventors IS NOT NULL THEN
      FOREACH v_applicant_name IN ARRAY v_inventors
      LOOP
        INSERT INTO ip_contributors (
          applicationId,
          firstName,
          lastName,
          role,
          isPrimary
        ) VALUES (
          v_app_id,
          -- Extract first name (everything before the last space)
          SUBSTRING(v_applicant_name FROM 1 FOR (POSITION(' ' IN v_applicant_name) - 1)),
          -- Extract last name (everything after the last space)
          SUBSTRING(v_applicant_name FROM (POSITION(' ' IN v_applicant_name) + 1)),
          'inventor',
          TRUE
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
    
    -- Log activity
    v_activity_title := 'New IP Application Created';
    
    INSERT INTO activity_log (
      applicationId,
      userId,
      activityType,
      title,
      description,
      createdAt
    ) VALUES (
      v_app_id,
      NEW.userId,
      'update',
      v_activity_title,
      'IP application automatically created from ' || v_source_type || ' submission',
      CURRENT_TIMESTAMP
    );
    
    -- Update the form submission with the new IP application ID
    UPDATE form_submission_registry
    SET 
      ipApplicationId = v_app_id,
      status = 'processed',
      processedAt = CURRENT_TIMESTAMP,
      updatedAt = CURRENT_TIMESTAMP
    WHERE registryId = NEW.registryId;
    
    -- Create notification for admins
    INSERT INTO ip_application_notification (
      ipApplicationId,
      formRegistryId,
      title,
      message,
      isPriority,
      createdAt
    )
    VALUES (
      v_app_id,
      NEW.registryId,
      'New IP Application: ' || v_title,
      'A new IP application has been automatically created from a ' || 
      REPLACE(v_source_type, '_', ' ') || ' submission.',
      TRUE,
      CURRENT_TIMESTAMP
    );
    
    -- Return the updated record
    RETURN NEW;
  END IF;
  
  -- If no changes needed, just return the record
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Update with error information
    UPDATE form_submission_registry
    SET 
      status = 'failed',
      processingErrors = SQLERRM,
      attemptsCount = COALESCE(attemptsCount, 0) + 1,
      updatedAt = CURRENT_TIMESTAMP
    WHERE registryId = NEW.registryId;
    
    -- Log error
    INSERT INTO activity_log (
      userId,
      activityType,
      title,
      description,
      createdAt
    ) VALUES (
      NEW.userId,
      'update',
      'Form Processing Error',
      'Error processing form submission: ' || SQLERRM,
      CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS after_form_submission_update ON form_submission_registry;
DROP TRIGGER IF EXISTS after_form_submission_insert ON form_submission_registry;

-- Trigger for updates to existing records
CREATE TRIGGER after_form_submission_update
AFTER UPDATE ON form_submission_registry
FOR EACH ROW
WHEN (OLD.status <> 'submitted' AND NEW.status = 'submitted')
EXECUTE FUNCTION process_form_submission();

-- Trigger for new records
CREATE TRIGGER after_form_submission_insert
AFTER INSERT ON form_submission_registry
FOR EACH ROW
WHEN (NEW.status = 'submitted')
EXECUTE FUNCTION process_form_submission(); 