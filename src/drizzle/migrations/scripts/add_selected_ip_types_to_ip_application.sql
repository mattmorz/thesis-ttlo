ALTER TABLE "ip_application"
ADD COLUMN IF NOT EXISTS "selected_ip_types" jsonb;

UPDATE "ip_application"
SET "selected_ip_types" = CASE "ip_type"
  WHEN 'copyright' THEN '{"copyright":true,"patent":false,"utilityModel":false,"industrialDesign":false,"trademark":false,"tradeSecret":false,"other":false,"notSure":false}'::jsonb
  WHEN 'patent' THEN '{"copyright":false,"patent":true,"utilityModel":false,"industrialDesign":false,"trademark":false,"tradeSecret":false,"other":false,"notSure":false}'::jsonb
  WHEN 'utility_model' THEN '{"copyright":false,"patent":false,"utilityModel":true,"industrialDesign":false,"trademark":false,"tradeSecret":false,"other":false,"notSure":false}'::jsonb
  WHEN 'industrial_design' THEN '{"copyright":false,"patent":false,"utilityModel":false,"industrialDesign":true,"trademark":false,"tradeSecret":false,"other":false,"notSure":false}'::jsonb
  WHEN 'trademark' THEN '{"copyright":false,"patent":false,"utilityModel":false,"industrialDesign":false,"trademark":true,"tradeSecret":false,"other":false,"notSure":false}'::jsonb
  WHEN 'trade_secret' THEN '{"copyright":false,"patent":false,"utilityModel":false,"industrialDesign":false,"trademark":false,"tradeSecret":true,"other":false,"notSure":false}'::jsonb
  WHEN 'not_sure' THEN '{"copyright":false,"patent":false,"utilityModel":false,"industrialDesign":false,"trademark":false,"tradeSecret":false,"other":false,"notSure":true}'::jsonb
  ELSE '{"copyright":false,"patent":false,"utilityModel":false,"industrialDesign":false,"trademark":false,"tradeSecret":false,"other":true,"notSure":false}'::jsonb
END
WHERE "selected_ip_types" IS NULL;
