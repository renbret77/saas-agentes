-- Migration Phase v37: GMM Intelligence Catalogs
CREATE TABLE IF NOT EXISTS hospital_catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurer_id UUID REFERENCES insurers(id),
    plan_name TEXT NOT NULL,
    region TEXT NOT NULL, -- Monterrey, CDMX, Guadalajara, etc.
    hospital_level TEXT, -- Basico, Medio, Integral, VIP
    main_hospitals TEXT[], -- Array of hospital names
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some expert data for GMM (Monterrey)
INSERT INTO hospital_catalogs (plan_name, region, hospital_level, main_hospitals)
VALUES 
('Plan Integral', 'Monterrey', 'Alto', ARRAY['Hospital Zambrano Hellion', 'Doctors Hospital', 'Hospital San José']),
('Plan Flex', 'Monterrey', 'Medio', ARRAY['Hospital Muguerza Alta Especialidad', 'Hospital Oca', 'Hospital Santa Engracia']);
