-- =============================================
--   Demo seed data for hackathon presentation
-- =============================================

-- Clear existing data (for fresh demo reset)
-- TRUNCATE tasks, needs, volunteers RESTART IDENTITY CASCADE;

-- ---- Volunteers ----
INSERT INTO volunteers (name, email, phone, skills, latitude, longitude, location_name, is_available, radius_km)
VALUES
  ('Priya Sharma',    'priya@example.com',   '9876543210', 'medical,first_aid,driving',      28.6139, 77.2090, 'Connaught Place, Delhi',    true, 15),
  ('Rahul Verma',     'rahul@example.com',   '9812345678', 'cooking,food_distribution',       28.6304, 77.2177, 'Chandni Chowk, Delhi',      true, 10),
  ('Anjali Singh',    'anjali@example.com',  '9823456789', 'counseling,shelter_management',   28.5355, 77.3910, 'Noida Sector 18',           true, 20),
  ('Mohammed Faizi',  'faizi@example.com',   '9834567890', 'driving,logistics,water_supply',  28.4595, 77.0266, 'Gurugram Cyber City',       true, 25),
  ('Sunita Rao',      'sunita@example.com',  '9845678901', 'medical,nursing,first_aid',       28.6562, 77.2410, 'Civil Lines, Delhi',        true, 12),
  ('Arjun Mehta',     'arjun@example.com',   '9856789012', 'construction,shelter_management', 28.5706, 77.3219, 'Lajpat Nagar, Delhi',       true, 18),
  ('Deepa Nair',      'deepa@example.com',   '9867890123', 'food_distribution,cooking',       28.6271, 77.0800, 'Dwarka Sector 10',          true, 15),
  ('Vikram Tomar',    'vikram@example.com',  '9878901234', 'driving,logistics',               28.7041, 77.1025, 'Rohini, Delhi',             true, 30),
  ('Kavya Reddy',     'kavya@example.com',   '9889012345', 'medical,counseling,first_aid',    28.5483, 77.2667, 'Saket, Delhi',              true, 10),
  ('Arun Kumar',      'arun@example.com',    '9890123456', 'water_supply,construction',       28.6692, 77.4538, 'Ghaziabad Vaishali',        true, 20);

-- ---- Community Needs ----
INSERT INTO needs (title, description, category, urgency, priority_score, status, latitude, longitude, location_name, reporter_name, reporter_contact, ai_reasoning)
VALUES
  ('Insulin shortage for elderly woman',
   'An elderly woman in Yamuna Vihar needs insulin urgently. She has Type 1 diabetes and will run out in 2 hours.',
   'MEDICAL', 'CRITICAL', 97, 'OPEN',
   28.6847, 77.2987, 'Yamuna Vihar, Delhi',
   'Rekha Devi', '9711234567',
   'Time-sensitive medical emergency requiring immediate intervention to prevent life-threatening situation.'),

  ('Food shortage at flood relief camp',
   'Over 200 displaced families at the Burari relief camp have not received food since morning. Children are hungry.',
   'FOOD', 'CRITICAL', 93, 'ASSIGNED',
   28.7420, 77.2000, 'Burari Relief Camp, Delhi',
   'Camp Coordinator Mishra', '9722345678',
   'Large-scale food emergency affecting vulnerable population including children at a disaster relief site.'),

  ('Drinking water contamination',
   'The borewell in Trilokpuri block C has been contaminated. 80 households are without safe drinking water for 3 days.',
   'WATER', 'HIGH', 82, 'OPEN',
   28.6174, 77.3130, 'Trilokpuri Block C, Delhi',
   'RWA Secretary Rajan', '9733456789',
   'Prolonged water contamination affecting a significant number of households, risk of waterborne illness.'),

  ('Temporary shelter needed after fire',
   'A fire in Seelampur destroyed 15 homes last night. 60 people including 20 children need emergency shelter.',
   'SHELTER', 'CRITICAL', 91, 'OPEN',
   28.6712, 77.3020, 'Seelampur JJ Colony, Delhi',
   'Pradhan Suresh Kumar', '9744567890',
   'Post-disaster shelter emergency displacing families with minors; urgency elevated by nighttime temperatures.'),

  ('Medicines for flood-affected area',
   'Primary health center in Najafgarh needs ORS packets, antibiotics, and wound dressings for flood-affected patients.',
   'MEDICAL', 'HIGH', 78, 'OPEN',
   28.6079, 76.9808, 'Najafgarh PHC, Delhi',
   'Dr. Anita Singh', '9755678901',
   'Healthcare supply shortage in a flood-affected zone; multiple patients at risk without basic medications.'),

  ('Mid-day meal distribution disrupted',
   'School in Bawana has 300 students but the cook is absent. Children depend on this as their only meal of the day.',
   'FOOD', 'MEDIUM', 62, 'OPEN',
   28.7826, 77.0394, 'Bawana Government School',
   'Principal Sharma', '9766789012',
   'Moderate urgency food gap affecting school-going children who depend on mid-day meal program.'),

  ('Flood relief camp sanitation crisis',
   'No toilet facilities at Tughlakabad relief camp. 150 people including elderly are being forced to go outdoors.',
   'SHELTER', 'HIGH', 75, 'ASSIGNED',
   28.5041, 77.2607, 'Tughlakabad Relief Camp',
   'Social Worker Poonam', '9777890123',
   'Sanitation emergency poses public health risk, especially for elderly and women at the relief camp.'),

  ('Water tanker needed for village',
   'Village in Mehrauli has no water supply for 5 days due to pipeline breakage. Villagers are using pond water.',
   'WATER', 'HIGH', 79, 'OPEN',
   28.5244, 77.1855, 'Mehrauli Village, Delhi',
   'Sarpanch Rajendra', '9788901234',
   'Extended water supply disruption forcing unsafe water use; risk of gastrointestinal illness outbreak.'),

  ('Blankets needed for homeless shelter',
   'Overnight temperature has dropped. The homeless shelter in Lodhi Colony needs 100 blankets urgently.',
   'SHELTER', 'MEDIUM', 58, 'RESOLVED',
   28.5931, 77.2311, 'Lodhi Colony Shelter Home',
   'NGO Director Kapoor', '9799012345',
   'Cold weather shelter need; urgency moderate as facility exists but lacks adequate supplies.'),

  ('Food for isolated elderly couple',
   'An 80-year-old couple in Laxmi Nagar is stranded due to flooding and has not eaten in 2 days.',
   'FOOD', 'HIGH', 86, 'OPEN',
   28.6333, 77.2833, 'Laxmi Nagar Block D',
   'Neighbour Geeta', '9700123456',
   'Elderly individuals isolated and unable to meet basic food needs; high vulnerability increases urgency.');