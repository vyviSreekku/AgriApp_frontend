import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentLocationName, getCurrentLocationData } from '../services/weatherDataHelper';
import { 
  getMarketPricesForCurrentLocation, 
  fetchMarketPriceSummary,
  getLocationDetails
} from '../services/marketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');

// Using a default crop icon for all crops since the specific images are missing
const defaultCropIcon = { uri: 'https://img.icons8.com/color/96/000000/wheat.png' };

// Crop icon mapping based on common crops
const CROP_ICONS = {
  'Rice': 'seedling',
  'Wheat': 'wheat',
  'Potato': 'apple-alt',
  'Onion': 'circle',
  'Tomato': 'apple-alt',
  'Corn': 'seedling',
  'Carrot': 'carrot',
  'Cabbage': 'leaf',
  'Cauliflower': 'leaf',
  'Pumpkin': 'apple-alt'
};

// Full list of crops for dropdown
const ALL_CROPS = [
  'Absinthe', 'Ajwan', 'Alasande Gram', 'Almond(Badam)', 'Alsandikai', 'Amaranthus',
  'Ambada Seed', 'Ambady/Mesta', 'Amla(Nelli Kai)', 'Amphophalus', 'Amranthas Red',
  'Antawala', 'Anthorium', 'Apple', 'Apricot(Jardalu/Khumani)', 'Arecanut(Betelnut/Supari)',
  'Arhar (Tur/Red Gram)(Whole)', 'Arhar Dal(Tur Dal)', 'Asalia', 'Ashgourd', 'Ashwagandha',
  'Asparagus', 'Astera', 'Avare Dal', 'BOP', 'Bael', 'Bajra(Pearl Millet/Cumbu)',
  'Balekai', 'Bamboo', 'Banana', 'Banana - Green', 'Barley (Jau)', 'Bay leaf (Tejpatta)',
  'Beans', 'Beaten Rice', 'Beetroot', 'Bengal Gram Dal (Chana Dal)', 'Bengal Gram(Gram)(Whole)',
  'Ber(Zizyphus/Borehannu)', 'Betal Leaves', 'Bhindi(Ladies Finger)', 'Bhui Amlaya',
  'Big Gram', 'Binoula', 'Bitter gourd', 'Black Gram (Urd Beans)(Whole)', 'Black Gram Dal (Urd Dal)',
  'Black pepper', 'Borehannu', 'Bottle gourd', 'Brahmi', 'Bran', 'Brinjal', 'Broken Rice',
  'Broomstick(Flower Broom)', 'Bull', 'Bullar', 'Bunch Beans', 'Butter', 'Cabbage',
  'Calendula', 'Calf', 'Cane', 'Capsicum', 'Cardamoms', 'Carnation', 'Carrot',
  'Cashew Kernnel', 'Cashewnuts', 'Castor Oil', 'Castor Seed', 'Cauliflower', 'Chakotha',
  'Chapparad Avare', 'Chennangi (Whole)', 'Chennangi Dal', 'Cherry', 'Chikoos(Sapota)',
  'Chili Red', 'Chilly Capsicum', 'Chow Chow', 'Chrysanthemum', 'Chrysanthemum(Loose)',
  'Cinamon(Dalchini)', 'Cloves', 'Cluster beans', 'Coca', 'Cock', 'Cocoa', 'Coconut',
  'Coconut Oil', 'Coconut Seed', 'Coffee', 'Colacasia', 'Copra', 'Coriander(Leaves)',
  'Corriander seed', 'Cotton', 'Cotton Seed', 'Cow', 'Cowpea (Lobia/Karamani)',
  'Cowpea(Veg)', 'Cucumbar(Kheera)', 'Cummin Seed(Jeera)', 'Custard Apple (Sharifa)',
  'Daila(Chandni)', 'Dal (Avare)', 'Dalda', 'Delha', 'Dhaincha', 'Drumstick',
  'Dry Chillies', 'Dry Fodder', 'Dry Grapes', 'Duck', 'Duster Beans', 'Egg',
  'Egypian Clover(Barseem)', 'Elephant Yam (Suran)', 'Field Pea', 'Fig(Anjura/Anjeer)',
  'Firewood', 'Fish', 'Flower Broom', 'Foxtail Millet(Navane)', 'French Beans (Frasbean)',
  'Galgal(Lemon)', 'Garlic', 'Ghee', 'Giloy', 'Gingelly Oil', 'Ginger(Dry)',
  'Ginger(Green)', 'Gladiolus Bulb', 'Gladiolus Cut Flower', 'Goat', 'Gram Raw(Chholia)',
  'Gramflour', 'Grapes', 'Green Avare (W)', 'Green Chilli', 'Green Fodder',
  'Green Gram (Moong)(Whole)', 'Green Gram Dal (Moong Dal)', 'Green Peas', 'Ground Nut Oil',
  'Ground Nut Seed', 'Groundnut', 'Groundnut (Split)', 'Groundnut pods (raw)', 'Guar',
  'Guar Seed(Cluster Beans Seed)', 'Guava', 'Gudmar', 'Gur(Jaggery)', 'Gurellu',
  'Haralekai', 'He Buffalo', 'Hen', 'Hippe Seed', 'Honey', 'Honge seed', 'Hybrid Cumbu',
  'Indian Beans (Seam)', 'Indian Colza(Sarson)', 'Isabgul (Psyllium)', 'Jack Fruit',
  'Jaffri', 'Jamamkhan', 'Jamun(Narale Hannu)', 'Jarbara', 'Jasmine', 'Javi',
  'Jowar(Sorghum)', 'Jute', 'Jute Seed', 'Kabuli Chana(Chickpeas-White)', 'Kacholam',
  'Kakada', 'Kalmegh', 'Kankambra', 'Karamani', 'Karbuja(Musk Melon)', 'Kartali (Kantola)',
  'Kharif Mash', 'Khoya', 'Kinnow', 'Knool Khol', 'Kodo Millet(Varagu)', 'Kuchur',
  'Kulthi(Horse Gram)', 'Kutki', 'Lak(Teora)', 'Leafy Vegetable', 'Lemon',
  'Lentil (Masur)(Whole)', 'Lilly', 'Lime', 'Linseed', 'Lint', 'Litchi',
  'Little gourd (Kundru)', 'Long Melon(Kakri)', 'Lotus', 'Lotus Sticks', 'Lukad',
  'Mace', 'Mahedi', 'Mahua', 'Mahua Seed(Hippe seed)', 'Maida Atta', 'Maize',
  'Mango', 'Mango (Raw-Ripe)', 'Maragensu', 'Marasebu', 'Marget', 'Marigold(Calcutta)',
  'Marigold(loose)', 'Mash', 'Mashrooms', 'Masur Dal', 'Mataki', 'Methi Seeds',
  'Methi(Leaves)', 'Millets', 'Mint(Pudina)', 'Moath Dal', 'Mousambi(Sweet Lime)',
  'Muesli', 'Muleti', 'Mustard', 'Mustard Oil', 'Myrobolan(Harad)', 'Nearle Hannu',
  'Neem Seed', 'Nelli Kai', 'Niger Seed (Ramtil)', 'Nutmeg', 'Onion', 'Onion Green',
  'Orange', 'Orchid', 'Other Pulses', 'Other green and fresh vegetables', 'Ox',
  'Paddy(Dhan)(Basmati)', 'Paddy(Dhan)(Common)', 'Palash flowers', 'Papaya',
  'Papaya (Raw)', 'Patti Calcutta', 'Peach', 'Pear(Marasebu)', 'Peas Wet',
  'Peas cod', 'Peas(Dry)', 'Pegeon Pea (Arhar Fali)', 'Pepper garbled',
  'Pepper ungarbled', 'Persimon(Japani Fal)', 'Pigs', 'Pineapple', 'Plum',
  'Pointed gourd (Parval)', 'Polherb', 'Pomegranate', 'Potato', 'Pumpkin', 'Pundi',
  'Pundi Seed', 'Pupadia', 'Raddish', 'Ragi (Finger Millet)', 'Raibel', 'Rajgir',
  'Ram', 'Rat Tail Radish (Mogari)', 'Ratanjot', 'Raya', 'Red Gram', 'Resinwood',
  'Riccbcan', 'Rice', 'Ridgeguard(Tori)', 'Rose(Local)', 'Rose(Loose))', 'Rose(Tata)',
  'Round gourd', 'Rubber', 'Sabu Dan', 'Safflower', 'Saffron', 'Sajje', 'Same/Savi',
  'Sarasum', 'Season Leaves', 'Seemebadnekai', 'Seetapal', 'Sesamum(Sesame,Gingelly,Til)',
  'She Buffalo', 'She Goat', 'Sheep', 'Siddota', 'Skin And Hide', 'Snakeguard',
  'Soanf', 'Soapnut(Antawala/Retha)', 'Soji', 'Sompu', 'Soyabean', 'Spinach',
  'Sponge gourd', 'Squash(Chappal Kadoo)', 'Sugar', 'Sugarcane', 'Sunflower',
  'Sunflower Seed', 'Sunhemp', 'Suram', 'Surat Beans (Papadi)', 'Suva (Dill Seed)',
  'Suvarna Gadde', 'Sweet Potato', 'Sweet Pumpkin', 'T.V. Cumbu', 'Tamarind Fruit',
  'Tamarind Seed', 'Tapioca', 'Taramira', 'Tea', 'Tender Coconut', 'Thinai (Italian Millet)',
  'Thogrikai', 'Thondekai', 'Tinda', 'Tobacco', 'Tomato', 'Torchwood', 'Toria',
  'Tube Flower', 'Tube Rose(Double)', 'Tube Rose(Loose)', 'Tube Rose(Single)',
  'Turmeric', 'Turmeric (raw)', 'Turnip', 'Walnut', 'Water Melon', 'Wheat',
  'Wheat Atta', 'White Muesli', 'White Peas', 'White Pumpkin', 'Wood', 'Wool',
  'Yam', 'Yam (Ratalu)', 'basil', 'buttery', 'dhawai flowers', 'dried mango',
  'gulli', 'karanja seeds', 'kutki', 'liquor turmeric', 'mango powder', 'nigella seeds',
  'poppy seeds', 'sanay', 'spikenard', 'stevia', 'stone pulverizer', 'vadang',
];

// Indian States and Districts data
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
];

const DISTRICTS_BY_STATE = {
  'Kerala': [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 
    'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ],
  'Karnataka': [
    'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 
    'Chamarajanagar', 'Chikballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 
    'Davangere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 
    'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 
    'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'
  ],
  'Tamil Nadu': [
    'Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 
    'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 
    'Madurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 
    'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 
    'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 
    'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
  ],
  'Maharashtra': [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 
    'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 
    'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 
    'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 
    'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
  ],
  'Andhra Pradesh': [
    'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kadapa', 'Krishna', 'Kurnool', 
    'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari'
  ],
  'Telangana': [
    'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 
    'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 
    'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal–Malkajgiri', 'Mulugu', 
    'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 
    'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 
    'Warangal Urban', 'Yadadri Bhuvanagiri'
  ],
  'Uttar Pradesh': [
    'Agra', 'Aligarh', 'Allahabad', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Azamgarh', 
    'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 
    'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 
    'Etawah', 'Faizabad', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 
    'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 
    'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar', 
    'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 
    'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Rae Bareli', 
    'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 
    'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'
  ],
  'West Bengal': [
    'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 
    'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 
    'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 
    'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'
  ],
  'Gujarat': [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 
    'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 
    'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 
    'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 
    'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'
  ],
  'Rajasthan': [
    'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 
    'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 
    'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 
    'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 
    'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'
  ],
  'Madhya Pradesh': [
    'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 
    'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 
    'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 
    'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 
    'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 
    'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 
    'Ujjain', 'Umaria', 'Vidisha'
  ],
  'Bihar': [
    'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 
    'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 
    'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 
    'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 
    'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'
  ],
  'Punjab': [
    'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 
    'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 
    'Muktsar', 'Nawanshahr', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 
    'Sangrur', 'Tarn Taran'
  ],
  'Haryana': [
    'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 
    'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Mewat', 
    'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'
  ],
  'Delhi': [
    'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 
    'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 
    'West Delhi'
  ],
  'Jammu and Kashmir': [
    'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 
    'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 
    'Samba', 'Shopian', 'Srinagar', 'Udhampur'
  ],
  'Odisha': [
    'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 
    'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 
    'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 
    'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
  ],
  'Chhattisgarh': [
    'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 
    'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 
    'Kanker', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur', 
    'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja'
  ],
  'Assam': [
    'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 
    'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 
    'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 
    'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 
    'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'
  ],
  'Jharkhand': [
    'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 
    'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 
    'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela Kharsawan', 
    'Simdega', 'West Singhbhum'
  ],
  'Uttarakhand': [
    'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 
    'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 
    'Uttarkashi'
  ],
  'Himachal Pradesh': [
    'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 
    'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'
  ],
  'Tripura': [
    'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 
    'Unakoti', 'West Tripura'
  ],
  'Meghalaya': [
    'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 
    'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 
    'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'
  ],
  'Manipur': [
    'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 
    'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 
    'Tengnoupal', 'Thoubal', 'Ukhrul'
  ],
  'Nagaland': [
    'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 
    'Tuensang', 'Wokha', 'Zunheboto'
  ],
  'Goa': [
    'North Goa', 'South Goa'
  ],
  'Arunachal Pradesh': [
    'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kra Daadi', 
    'Kurung Kumey', 'Lepa Rada', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang', 
    'Lower Subansiri', 'Namsai', 'Pakke Kessang', 'Papum Pare', 'Shi Yomi', 'Siang', 
    'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'
  ],
  'Mizoram': [
    'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 
    'Mamit', 'Saiha', 'Saitual', 'Serchhip'
  ],
  'Sikkim': [
    'East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'
  ],
  'Ladakh': [
    'Kargil', 'Leh'
  ],
  'Puducherry': [
    'Karaikal', 'Mahe', 'Puducherry', 'Yanam'
  ]
};

// No longer using fallback data - we'll show proper error messages instead

// Key for storing recent crops in AsyncStorage
const RECENT_CROPS_KEY = 'recentCrops';

const MarketScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Loading...');
  const [loading, setLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [recentCrops, setRecentCrops] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationDetails, setLocationDetails] = useState({
    state: null,
    district: null,
    fullLocation: 'Unknown Location'
  });
  const [apiError, setApiError] = useState(null);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [currentStep, setCurrentStep] = useState('state'); // 'state' or 'district'
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  // Filtered items based on current step and search
  const filteredItems = currentStep === 'state'
    ? (locationSearchQuery
        ? INDIAN_STATES.filter(state =>
            state.toLowerCase().includes(locationSearchQuery.toLowerCase())
          )
        : INDIAN_STATES)
    : (selectedState && DISTRICTS_BY_STATE[selectedState]
        ? (locationSearchQuery
            ? DISTRICTS_BY_STATE[selectedState].filter(district =>
                district.toLowerCase().includes(locationSearchQuery.toLowerCase())
              )
            : DISTRICTS_BY_STATE[selectedState])
        : []);

  useEffect(() => {
    // Fetch location details including state and district
    async function fetchLocationDetails() {
      try {
        // Get current location name for display
        const locationName = await getCurrentLocationName();
        setLocation(locationName);
        
        // Get detailed location data from the weather service
        const locationData = await getCurrentLocationData();
        
        // Convert the weather location format to the format expected by market API
        const marketLocationDetails = {
          state: locationData.state || null,
          district: locationData.district || null,
          fullLocation: locationData.display_name || locationName
        };
        
        setLocationDetails(marketLocationDetails);
        console.log('Location details for market API:', marketLocationDetails);
      } catch (error) {
        console.error('Error fetching location details:', error);
        setLocation('Unknown Location');
      }
    }
    
    // Initialize with empty price history, will be updated when crop is selected
    setPriceHistory([
      { date: 'Oct 5', price: 0 },
      { date: 'Oct 6', price: 0 },
      { date: 'Oct 7', price: 0 },
      { date: 'Oct 8', price: 0 },
      { date: 'Oct 9', price: 0 },
      { date: 'Oct 10', price: 0 },
      { date: 'Oct 11', price: 0 },
    ]);

    // Load recent crops
    async function loadRecentCrops() {
      try {
        const storedCrops = await AsyncStorage.getItem(RECENT_CROPS_KEY);
        if (storedCrops) {
          setRecentCrops(JSON.parse(storedCrops));
        }
      } catch (error) {
        console.error('Error loading recent crops:', error);
      }
    }

    fetchLocationDetails();
    loadRecentCrops();
  }, []);

  // Filter crops based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = ALL_CROPS.filter(crop => 
        crop.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCrops(filtered.slice(0, 100)); // Limit to prevent performance issues
    } else {
      setFilteredCrops([]); // Empty when no search query
    }
  }, [searchQuery]);

  // Handle location selection from modal
  const handleLocationSelect = () => {
    if (selectedState && selectedDistrict) {
      const newLocationDetails = {
        state: selectedState,
        district: selectedDistrict,
        fullLocation: `${selectedDistrict}, ${selectedState}`
      };

      setLocationDetails(newLocationDetails);
      setLocation(`${selectedDistrict}, ${selectedState}`);
      setShowLocationModal(false);
      setSelectedState(null);
      setSelectedDistrict(null);
      setCurrentStep('state');
      setLocationSearchQuery('');

      // If a crop is selected, refresh the data with new location
      if (selectedCrop) {
        fetchMarketData(selectedCrop.name);
      }
    }
  };

  // Handle item selection (state or district)
  const handleItemSelect = (item) => {
    if (currentStep === 'state') {
      setSelectedState(item);
      setSelectedDistrict(null);
      setCurrentStep('district');
      setLocationSearchQuery('');
    } else {
      setSelectedDistrict(item);
      // Don't auto-confirm, let user use confirm button
    }
  };

  // Pull-to-refresh handler used by RefreshControl
  const onRefresh = async () => {
    setRefreshing(true);
    setApiError(null);
    try {
      // Check if user has selected a location, if so preserve it
      let currentLocationDetails = locationDetails;
      let currentLocationName = location;

      // Only fetch GPS location if no user selection exists
      if (!locationDetails.state || !locationDetails.district) {
        // Refresh displayed location name and detailed data from GPS
        const locationName = await getCurrentLocationName();
        setLocation(locationName);
        currentLocationName = locationName;

        const locationData = await getCurrentLocationData();
        const marketLocationDetails = {
          state: locationData.state || null,
          district: locationData.district || null,
          fullLocation: locationData.display_name || locationName
        };

        setLocationDetails(marketLocationDetails);
        currentLocationDetails = marketLocationDetails;
      }

      // If a crop is already selected, refresh market data for it using current location
      if (selectedCrop) {
        await fetchMarketData(selectedCrop.name);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      setApiError('Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Fetch market data from API
  const fetchMarketData = async (cropName) => {
    setApiError(null);
    
    try {
      // Use selected location if available, otherwise use current location
      const selectedState = locationDetails.state;
      const selectedDistrict = locationDetails.district;
      
      const result = await getMarketPricesForCurrentLocation(cropName, selectedState, selectedDistrict);
      
      if (result.success && result.data && result.data.length > 0) {
        // Transform API data to match our UI format
        const transformedData = result.data.flatMap((marketData, index) => {
          // Each market may have multiple price entries
          return marketData.prices.map((price, priceIndex) => ({
            id: `${index}-${priceIndex}`,
            market: marketData.market,
            price: `₹${price.modal_price}/quintal`,
            min_price: price.min_price,
            max_price: price.max_price,
            date: price.date,
            variety: price.variety,
            grade: price.grade,
            // Simulate distance based on index for now - in a real app this would come from geolocation
            distance: `${Math.floor(10 + Math.random() * 90)} km`
          }));
        });
        
        setMarketPrices(transformedData);
        
        // Also fetch price summary for the price trend chart
        try {
          const summary = await fetchMarketPriceSummary(cropName, locationDetails.state);
          if (summary.success && summary.summary) {
            // Generate mock price history based on the summary data
            // In a real app, you would have actual historical data
            const avgPrice = summary.summary.average_price || 2000;
            const minPrice = summary.summary.min_price || avgPrice * 0.9;
            const maxPrice = summary.summary.max_price || avgPrice * 1.1;
            
            // Create some variation in the history
            const today = new Date();
            const newHistory = Array(7).fill(0).map((_, i) => {
              const date = new Date(today);
              date.setDate(date.getDate() - (6 - i));
              
              // Generate a price within the min-max range with some randomness
              const variation = (Math.random() - 0.5) * 0.1; // +/- 5%
              const price = avgPrice * (1 + variation);
              
              return {
                date: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
                price: Math.round(price)
              };
            });
            
            setPriceHistory(newHistory);
          }
        } catch (summaryError) {
          console.error('Error fetching price summary:', summaryError);
        }
      } else {
        // Show no data available message if API returns empty results
        console.log('No market data found for this crop');
        setMarketPrices([]);
        setApiError(`No market prices available for ${cropName} in your region.`);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      setApiError('Failed to load market prices. Please try again later.');
      
      // Clear any previous data
      setMarketPrices([]);
    }
  };

  const handleCropSelect = (cropName) => {
    // Create a crop object from the selected name
    const crop = { name: cropName };
    setSelectedCrop(crop);
    setIsDropdownVisible(false);
    setSearchQuery(cropName);
    setLoading(true);
    
    // Add to recent crops
    saveRecentCrop(cropName);
    
    // Fetch real market data
    fetchMarketData(cropName)
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Save recently selected crop
  const saveRecentCrop = async (cropName) => {
    try {
      // Remove existing instance of the crop if any
      const filteredCrops = recentCrops.filter(crop => crop !== cropName);
      
      // Add the new crop to the beginning (top of stack)
      let updatedRecent = [cropName, ...filteredCrops];
      
      // Limit to maximum 10
      if (updatedRecent.length > 10) {
        updatedRecent = updatedRecent.slice(0, 10);
      }
      
      setRecentCrops(updatedRecent);
      await AsyncStorage.setItem(RECENT_CROPS_KEY, JSON.stringify(updatedRecent));
    } catch (error) {
      console.error('Error saving recent crop:', error);
    }
  };

  const renderCropItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleCropSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );
  
  // Helper function to get crop icon name
  const getCropIconName = (cropName) => {
    return CROP_ICONS[cropName] || 'seedling';
  };

  const renderRecentCropItem = ({ item }) => {
    const isSelected = selectedCrop?.name === item;

    return (
      <TouchableOpacity
        style={[
          styles.recentCropItem,
          isSelected && styles.selectedRecentCropItem
        ]}
        onPress={() => handleCropSelect(item)}
      >
        <Text style={[
          styles.recentCropText,
          isSelected && styles.selectedRecentCropText
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMarketItem = ({ item }) => (
    <View style={styles.marketItem}>
      <View style={styles.marketHeader}>
        <View style={styles.marketTitleContainer}>
          <View style={styles.marketIconContainer}>
            <Ionicons name="business-outline" size={18} color="#4f46e5" />
          </View>
          <Text style={styles.marketName}>{item.market}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceLabel}>Current Price</Text>
          <Text style={styles.priceValue}>{item.price}</Text>
          {item.date && (
            <Text style={styles.priceDate}>Updated: {item.date}</Text>
          )}
        </View>
      </View>
      
      {/* Variety and grade information */}
      {(item.variety || item.grade) && (
        <View style={styles.detailsRow}>
          {item.variety && (
            <View style={styles.detailBadge}>
              <Text style={styles.detailLabel}>Variety:</Text>
              <Text style={styles.detailValue}>{item.variety}</Text>
            </View>
          )}
          {item.grade && (
            <View style={styles.detailBadge}>
              <Text style={styles.detailLabel}>Grade:</Text>
              <Text style={styles.detailValue}>{item.grade}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Price range */}
      {(item.min_price || item.max_price) && (
        <View style={styles.priceRangeContainer}>
          <View style={styles.priceRangeItem}>
            <Text style={styles.priceRangeLabel}>Min Price</Text>
            <Text style={styles.priceRangeValue}>₹{item.min_price || '—'}</Text>
          </View>
          <View style={styles.priceRangeDivider} />
          <View style={styles.priceRangeItem}>
            <Text style={styles.priceRangeLabel}>Max Price</Text>
            <Text style={styles.priceRangeValue}>₹{item.max_price || '—'}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={[{ key: 'content' }]}
          renderItem={() => (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Market Prices</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#64748b" />
                    <Text style={styles.locationText}>{location}</Text>
                  </View>
                </View>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={() => setShowLocationModal(true)}
                  >
                    <Ionicons name="location" size={20} color="#4f46e5" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Bar / Dropdown */}
              <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                  <Feather name="search" size={20} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for crops"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setIsDropdownVisible(!!text);
                    }}
                    onFocus={() => setIsDropdownVisible(!!searchQuery)}
                    placeholderTextColor="#94a3b8"
                  />
                  {searchQuery ? (
                    <TouchableOpacity 
                      onPress={() => {
                        setSearchQuery('');
                        setIsDropdownVisible(false);
                      }}
                    >
                      <Feather name="x" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                
                {isDropdownVisible && (
                  <View style={styles.dropdownContainer}>
                    <FlatList
                      data={filteredCrops}
                      renderItem={renderCropItem}
                      keyExtractor={(item, index) => index.toString()}
                      style={styles.dropdown}
                      showsVerticalScrollIndicator={true}
                      initialNumToRender={15}
                    />
                  </View>
                )}
              </View>

              {/* Recent Crops */}
              {recentCrops.length > 0 && (
                <View style={styles.recentCropsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleContainer}>
                      <Ionicons name="time-outline" size={16} color="#4f46e5" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>Recently Viewed</Text>
                    </View>
                    {recentCrops.length > 3 && (
                      <TouchableOpacity onPress={() => setShowAllRecent(!showAllRecent)}>
                        <Text style={styles.viewAllText}>
                          {showAllRecent ? 'View Less' : 'View All'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Horizontal scroll for first 3 crops */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentCropsContainer}
                  >
                    {recentCrops.slice(0, 3).map((item, index) => (
                      <View key={index} style={styles.recentCropWrapper}>
                        {renderRecentCropItem({ item })}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Grid view for remaining crops when expanded */}
                  {showAllRecent && recentCrops.length > 3 && (
                    <View style={styles.expandedRecentCropsContainer}>
                      {recentCrops.slice(3).map((item, index) => (
                        <View key={`expanded-${index}`} style={styles.expandedRecentCropWrapper}>
                          {renderRecentCropItem({ item })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Market Prices */}
              <View style={styles.pricesContainer}>
                <View style={styles.pricesHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <MaterialIcons name="store" size={20} color="#4f46e5" style={styles.sectionIcon} />
                    <Text style={styles.pricesTitle}>
                      {selectedCrop ? `Markets for ${selectedCrop.name}` : 'Available Markets'}
                    </Text>
                  </View>
                </View>

                {selectedCrop ? (
                  loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#4f46e5" />
                      <Text style={styles.loadingText}>Loading market prices...</Text>
                    </View>
                  ) : (
                    <>
                      {apiError && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
                          <Text style={styles.errorText}>{apiError}</Text>
                        </View>
                      )}
                      {marketPrices.length > 0 ? (
                        <View style={styles.marketsList}>
                          {marketPrices.map((item, index) => (
                            <View key={item.id || index}>
                              {renderMarketItem({ item })}
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.noDataContainer}>
                          <Ionicons name="information-circle-outline" size={50} color="#94a3b8" />
                          <Text style={styles.noDataTitle}>No Market Data Available</Text>
                          <Text style={styles.noDataText}>
                            We couldn't find price data for {selectedCrop.name} in your region. 
                            Try selecting a different crop or pull down to refresh.
                          </Text>
                        </View>
                      )}
                    </>
                  )
                ) : (
                  <View style={styles.placeholderContainer}>
                    <View style={styles.placeholderImageContainer}>
                      <Ionicons name="basket-outline" size={70} color="#94a3b8" />
                    </View>
                    <Text style={styles.placeholderTitle}>No Market Selected</Text>
                    <Text style={styles.placeholderText}>
                      Select a crop from the search or recent items to view current market prices
                    </Text>
                    <TouchableOpacity 
                      style={styles.placeholderButton}
                      onPress={() => setIsDropdownVisible(true)}
                    >
                      <Text style={styles.placeholderButtonText}>Search Crops</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
              </View>
              
              {/* Footer spacing */}
              <View style={{height: 100}} />
            </>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
          }
        />
      </LinearGradient>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowLocationModal(false);
          setSelectedState(null);
          setSelectedDistrict(null);
          setCurrentStep('state');
          setLocationSearchQuery('');
        }}
      >
        <View style={modalStyles.fullScreenModal}>
          {/* Header */}
          <View style={modalStyles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (currentStep === 'district') {
                  setCurrentStep('state');
                  setLocationSearchQuery('');
                } else {
                  setShowLocationModal(false);
                  setSelectedState(null);
                  setSelectedDistrict(null);
                  setCurrentStep('state');
                  setLocationSearchQuery('');
                }
              }}
              style={modalStyles.backButton}
            >
              <Ionicons
                name={currentStep === 'district' ? "arrow-back" : "close"}
                size={28}
                color="#64748b"
              />
            </TouchableOpacity>
            <Text style={modalStyles.modalTitle}>
              {currentStep === 'state' ? 'Select State' : 'Select District'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Bar */}
          <View style={modalStyles.searchContainer}>
            <View style={modalStyles.searchBar}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={modalStyles.searchInput}
                placeholder={`Search ${currentStep === 'state' ? 'states' : 'districts'}...`}
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
                placeholderTextColor="#94a3b8"
                autoFocus={true}
              />
              {locationSearchQuery ? (
                <TouchableOpacity
                  onPress={() => setLocationSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Content */}
          <View style={modalStyles.content}>
            {currentStep === 'district' && selectedState && (
              <View style={modalStyles.selectedStateContainer}>
                <Text style={modalStyles.selectedStateText}>
                  State: {selectedState}
                </Text>
              </View>
            )}

            <FlatList
              data={filteredItems}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={modalStyles.locationItem}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={modalStyles.locationItemText}>{item}</Text>
                  {(currentStep === 'state' && selectedState === item) ||
                   (currentStep === 'district' && selectedDistrict === item) ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `${currentStep}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.listContainer}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          </View>

          {/* Confirm Button */}
          {selectedDistrict && (
            <View style={modalStyles.confirmButtonContainer}>
              <TouchableOpacity
                style={modalStyles.confirmButton}
                onPress={handleLocationSelect}
              >
                <Text style={modalStyles.confirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  locationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    zIndex: 100,
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedFilterOption: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  applyFiltersButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  applyFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdown: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#334155',
  },
  recentCropsSection: {
    marginBottom: 15,
  },
  recentCropsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
  },
  recentCropWrapper: {
    marginRight: 12,
  },
  expandedRecentCropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'flex-start',
  },
  expandedRecentCropWrapper: {
    width: '30%', // 3 columns
    marginRight: '3.33%', // spacing between items
    marginBottom: 10,
  },
  recentCropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentCropContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  recentCropLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCropIconBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cropIcon: {
    marginRight: 0,
  },
  selectedRecentCropItem: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  recentCropText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  priceBadge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  selectedPriceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recentCropPrice: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '700',
  },
  selectedRecentCropText: {
    color: '#fff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
    marginHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  recentBadge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  recentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4f46e5',
  },
  cropsList: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  cropItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedCropItem: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  cropImage: {
    width: 42,
    height: 42,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  selectedCropText: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  chartOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartOptionText: {
    fontSize: 14,
    color: '#4f46e5',
    marginRight: 5,
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginVertical: 10,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: (width - 100) / 8,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    marginHorizontal: 3,
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  chartFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  chartFooterText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  pricesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    paddingTop: 10,
  },
  pricesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  pricesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
    marginLeft: 6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  placeholderImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: 20,
  },
  placeholderButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  placeholderButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  marketsList: {
    padding: 12,
  },
  marketItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  marketTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  marketName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  tipsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  priceDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  detailBadge: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  priceRangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceRangeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  priceRangeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  priceRangeDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  noDataContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 16,
  },
});

// Modal Styles
const modalStyles = StyleSheet.create({
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50, // Extra padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  selectedStateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  selectedStateText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  locationItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  confirmButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MarketScreen;
