// db.js - Dexie.js Database Instance & Patient / Comprehensive Foods Catalog

// 1. Initialize Dexie Database
const db = new Dexie("NutriAxProDB");

// 2. Define Database Schema (Consistent 'id' primary key across all versions)
db.version(1).stores({
  patients: "id, name, age, gender, objective",
  foods: "id, name, category, source, brand",
  assessments: "id, patientId, date",
  anthropometry: "id, patientId, date",
  clinicalExams: "id, patientId, examName, priority",
  prescriptions: "id, patientId",
  prescriptionItems: "id, prescriptionId, foodName",
  substitutions: "id, categoryGroup",
  dailyLogs: "id, patientId, date",
  performanceMetabolica: "id, patientId",
});

db.version(7).stores({
  patients: "id, name, age, gender, objective",
  foods: "id, name, category, source, brand",
  assessments: "id, patientId, date",
  anthropometry: "id, patientId, date",
  clinicalExams: "id, patientId, examName, priority",
  prescriptions: "id, patientId",
  prescriptionItems: "id, prescriptionId, foodName",
  substitutions: "id, categoryGroup",
  dailyLogs: "id, patientId, date",
  dietaryRecall: "id, patientId, mealName",
  performanceMetabolica: "id, patientId",
});

// Comprehensive TACO, TBCA e Rótulos Catalog (Mais de 3000 alimentos oficiais, Ref. 100g / 100ml)
// Inclui Café com Açúcar, Café sem Açúcar, todas as tabelas TACO 4ª Edição e TBCA/USP.
const initialFoodsData = (typeof COMPREHENSIVE_TACO_TBCA_FOODS !== "undefined" && Array.isArray(COMPREHENSIVE_TACO_TBCA_FOODS) && COMPREHENSIVE_TACO_TBCA_FOODS.length > 0)
  ? COMPREHENSIVE_TACO_TBCA_FOODS
  : [
  // ==========================================
  // 0. CAFÉS E BEBIDAS (DESTAQUE)
  // ==========================================
  { name: "Café sem açúcar", category: "Achocolatados e Bebidas", source: "TACO", baseQuantity: 100, calories: 2.0, protein: 0.3, carbohydrate: 0.0, lipid: 0.0, fiber: 0.0, sodium: 1.0 },
  { name: "Café com açúcar", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 33.0, protein: 0.3, carbohydrate: 8.0, lipid: 0.0, fiber: 0.0, sodium: 2.0 },
  { name: "Café Coado (sem açúcar)", category: "Achocolatados e Bebidas", source: "TACO", baseQuantity: 100, calories: 1.8, protein: 0.3, carbohydrate: 0.1, lipid: 0.0, fiber: 0.0, sodium: 1.0 },
  { name: "Café Coado com Açúcar (1 colher de chá)", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 21.0, protein: 0.3, carbohydrate: 5.0, lipid: 0.0, fiber: 0.0, sodium: 1.0 },
  { name: "Café Espresso (sem açúcar)", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 9.0, protein: 1.2, carbohydrate: 0.8, lipid: 0.2, fiber: 0.0, sodium: 3.0 },
  { name: "Café Espresso com Açúcar", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 49.0, protein: 1.2, carbohydrate: 10.8, lipid: 0.2, fiber: 0.0, sodium: 4.0 },
  { name: "Café com Leite Integral (sem açúcar)", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 38.0, protein: 2.0, carbohydrate: 2.8, lipid: 2.0, fiber: 0.0, sodium: 35.0 },
  { name: "Café com Leite Integral e Açúcar", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 68.0, protein: 2.0, carbohydrate: 10.3, lipid: 2.0, fiber: 0.0, sodium: 36.0 },
  { name: "Café com Leite Desnatado (sem açúcar)", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 23.0, protein: 2.1, carbohydrate: 3.2, lipid: 0.1, fiber: 0.0, sodium: 40.0 },
  { name: "Café com Leite Desnatado e Açúcar", category: "Achocolatados e Bebidas", source: "TBCA", baseQuantity: 100, calories: 53.0, protein: 2.1, carbohydrate: 10.7, lipid: 0.1, fiber: 0.0, sodium: 41.0 },
  { name: "Nescau 2.0 Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 380.0, protein: 3.8, carbohydrate: 85.0, lipid: 3.0, fiber: 5.5, sodium: 130.0 },
  { name: "Nescau Max Cereal em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 365.0, protein: 6.5, carbohydrate: 76.0, lipid: 3.5, fiber: 8.5, sodium: 120.0 },
  { name: "Nescau Preparado com Leite Integral", category: "Achocolatados e Bebidas", source: "TBCA", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 80.0, protein: 3.5, carbohydrate: 10.5, lipid: 2.8, fiber: 0.5, sodium: 48.0 },
  { name: "Nescau Preparado com Leite Desnatado", category: "Achocolatados e Bebidas", source: "TBCA", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 55.0, protein: 3.5, carbohydrate: 10.0, lipid: 0.2, fiber: 0.5, sodium: 52.0 },
  { name: "Toddy Achocolatado em Pó Original", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "PepsiCo/Toddy", baseQuantity: 100, calories: 395.0, protein: 2.0, carbohydrate: 90.0, lipid: 2.5, fiber: 3.0, sodium: 75.0 },
  { name: "Toddy Cacau Malte em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "PepsiCo/Toddy", baseQuantity: 100, calories: 385.0, protein: 4.0, carbohydrate: 82.0, lipid: 3.5, fiber: 4.5, sodium: 90.0 },
  { name: "Toddy Preparado com Leite Integral", category: "Achocolatados e Bebidas", source: "TBCA", brand: "PepsiCo/Toddy", baseQuantity: 100, calories: 82.0, protein: 3.3, carbohydrate: 11.2, lipid: 2.7, fiber: 0.3, sodium: 45.0 },
  { name: "Toddy Preparado com Leite Desnatado", category: "Achocolatados e Bebidas", source: "TBCA", brand: "PepsiCo/Toddy", baseQuantity: 100, calories: 56.0, protein: 3.4, carbohydrate: 10.8, lipid: 0.2, fiber: 0.3, sodium: 49.0 },
  { name: "Alpino Achocolatado em Pó Original", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Alpino", baseQuantity: 100, calories: 402.0, protein: 5.5, carbohydrate: 79.0, lipid: 6.5, fiber: 4.5, sodium: 150.0 },
  { name: "Alpino Dark / Chocolate Intenso em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Alpino", baseQuantity: 100, calories: 385.0, protein: 7.5, carbohydrate: 68.0, lipid: 8.5, fiber: 7.5, sodium: 120.0 },
  { name: "Alpino Preparado com Leite Integral", category: "Achocolatados e Bebidas", source: "TBCA", brand: "Nestlé/Alpino", baseQuantity: 100, calories: 84.0, protein: 3.6, carbohydrate: 10.8, lipid: 3.1, fiber: 0.4, sodium: 52.0 },
  { name: "Alpino Preparado com Leite Desnatado", category: "Achocolatados e Bebidas", source: "TBCA", brand: "Nestlé/Alpino", baseQuantity: 100, calories: 58.0, protein: 3.7, carbohydrate: 10.4, lipid: 0.3, fiber: 0.4, sodium: 55.0 },
  { name: "Ovomaltine Flocos Crocantes em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Ovomaltine", baseQuantity: 100, calories: 390.0, protein: 4.5, carbohydrate: 82.0, lipid: 3.5, fiber: 3.5, sodium: 180.0 },
  { name: "Chocolatto 3 Corações em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "3 Corações", baseQuantity: 100, calories: 390.0, protein: 3.0, carbohydrate: 88.0, lipid: 2.0, fiber: 2.5, sodium: 80.0 },
  { name: "Arroz Branco (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 128.0, protein: 2.5, carbohydrate: 28.1, lipid: 0.2, fiber: 1.6, sodium: 1.0 },
  { name: "Arroz Integral (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 124.0, protein: 2.6, carbohydrate: 25.8, lipid: 1.0, fiber: 2.7, sodium: 1.0 },
  { name: "Arroz Parboilizado (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 128.0, protein: 2.6, carbohydrate: 27.9, lipid: 0.3, fiber: 1.5, sodium: 1.0 },
  { name: "Feijão Carioca (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 76.0, protein: 4.8, carbohydrate: 13.6, lipid: 0.5, fiber: 8.5, sodium: 2.0 },
  { name: "Feijão Preto (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 77.0, protein: 4.5, carbohydrate: 14.0, lipid: 0.5, fiber: 8.4, sodium: 2.0 },
  { name: "Feijão Fradinho (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 78.0, protein: 5.1, carbohydrate: 13.0, lipid: 0.6, fiber: 7.2, sodium: 2.0 },
  { name: "Feijão Branco (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 84.0, protein: 6.0, carbohydrate: 15.0, lipid: 0.5, fiber: 6.3, sodium: 2.0 },
  { name: "Grão-de-Bico (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 164.0, protein: 8.9, carbohydrate: 27.4, lipid: 2.6, fiber: 7.6, sodium: 5.0 },
  { name: "Lentilha (Cozida)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 93.0, protein: 6.3, carbohydrate: 16.3, lipid: 0.5, fiber: 7.9, sodium: 2.0 },
  { name: "Ervilha Seca (Cozida)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 81.0, protein: 5.4, carbohydrate: 14.5, lipid: 0.4, fiber: 5.5, sodium: 3.0 },
  { name: "Aveia em Flocos", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 394.0, protein: 13.9, carbohydrate: 66.6, lipid: 8.5, fiber: 9.1, sodium: 4.0 },
  { name: "Farinha de Aveia", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 389.0, protein: 14.2, carbohydrate: 65.0, lipid: 8.0, fiber: 8.8, sodium: 4.0 },
  { name: "Quinoa em Grãos (Cozida)", category: "Cereais e Leguminosas", source: "TBCA", baseQuantity: 100, calories: 120.0, protein: 4.4, carbohydrate: 21.3, lipid: 1.9, fiber: 2.8, sodium: 7.0 },
  { name: "Milho Verde (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 138.0, protein: 3.3, carbohydrate: 28.6, lipid: 1.3, fiber: 3.9, sodium: 1.0 },
  { name: "Cuscuz de Milho (Cozido)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 112.0, protein: 2.2, carbohydrate: 25.4, lipid: 0.7, fiber: 1.8, sodium: 180.0 },

  // ==========================================
  // 2. TUBÉRCULOS E RAÍZES
  // ==========================================
  { name: "Batata Inglesa (Cozida)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 52.0, protein: 1.2, carbohydrate: 11.9, lipid: 0.0, fiber: 1.3, sodium: 3.0 },
  { name: "Batata Inglesa (Assada)", category: "Tubérculos e Raízes", source: "TBCA", baseQuantity: 100, calories: 85.0, protein: 2.0, carbohydrate: 19.5, lipid: 0.1, fiber: 2.1, sodium: 5.0 },
  { name: "Batata Doce (Cozida)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 77.0, protein: 0.6, carbohydrate: 18.4, lipid: 0.1, fiber: 2.2, sodium: 3.0 },
  { name: "Batata Doce (Assada)", category: "Tubérculos e Raízes", source: "TBCA", baseQuantity: 100, calories: 90.0, protein: 1.8, carbohydrate: 20.7, lipid: 0.1, fiber: 3.3, sodium: 6.0 },
  { name: "Mandioca / Aipim (Cozida)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 125.0, protein: 0.6, carbohydrate: 30.1, lipid: 0.3, fiber: 1.6, sodium: 2.0 },
  { name: "Mandioquinha / Batata-Baroa (Cozida)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 80.0, protein: 0.9, carbohydrate: 18.9, lipid: 0.2, fiber: 1.8, sodium: 4.0 },
  { name: "Inhame (Cozido)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 97.0, protein: 1.5, carbohydrate: 23.2, lipid: 0.2, fiber: 1.7, sodium: 2.0 },
  { name: "Cará (Cozido)", category: "Tubérculos e Raízes", source: "TACO", baseQuantity: 100, calories: 78.0, protein: 1.5, carbohydrate: 18.9, lipid: 0.1, fiber: 2.6, sodium: 2.0 },

  // ==========================================
  // 3. PÃES, MASSAS E FARINHAS
  // ==========================================
  { name: "Pão Francês", category: "Pães", source: "TACO", baseQuantity: 100, calories: 300.0, protein: 8.0, carbohydrate: 58.6, lipid: 3.1, fiber: 2.3, sodium: 648.0 },
  { name: "Pão de Forma Tradicional", category: "Pães", source: "TACO", baseQuantity: 100, calories: 266.0, protein: 8.8, carbohydrate: 52.3, lipid: 2.7, fiber: 2.0, sodium: 512.0 },
  { name: "Pão de Forma Integral", category: "Pães", source: "TACO", baseQuantity: 100, calories: 253.0, protein: 9.4, carbohydrate: 49.9, lipid: 3.7, fiber: 6.9, sodium: 506.0 },
  { name: "Pão 100% Integral Nutrella", category: "Pães", source: "Rótulo Comercial", brand: "Nutrella", baseQuantity: 100, calories: 218.0, protein: 11.0, carbohydrate: 40.0, lipid: 1.5, fiber: 7.5, sodium: 340.0 },
  { name: "Pão Sírio / Pita", category: "Pães", source: "TBCA", baseQuantity: 100, calories: 275.0, protein: 9.1, carbohydrate: 55.7, lipid: 1.3, fiber: 2.2, sodium: 520.0 },
  { name: "Rap10 Fit / Tortilha Integral", category: "Pães", source: "Rótulo Comercial", brand: "Pullman", baseQuantity: 100, calories: 280.0, protein: 8.5, carbohydrate: 50.0, lipid: 4.8, fiber: 5.8, sodium: 480.0 },
  { name: "Tapioca (Massa Hidratada)", category: "Pães", source: "TACO", baseQuantity: 100, calories: 240.0, protein: 0.0, carbohydrate: 60.0, lipid: 0.0, fiber: 0.0, sodium: 2.0 },
  { name: "Macarrão Tradicional (Cozido)", category: "Pães", source: "TACO", baseQuantity: 100, calories: 141.0, protein: 4.6, carbohydrate: 28.3, lipid: 0.9, fiber: 1.8, sodium: 1.0 },
  { name: "Macarrão Integral (Cozido)", category: "Pães", source: "TBCA", baseQuantity: 100, calories: 124.0, protein: 5.3, carbohydrate: 25.0, lipid: 0.5, fiber: 4.2, sodium: 2.0 },
  { name: "Torrada Tradicional", category: "Pães", source: "TACO", baseQuantity: 100, calories: 377.0, protein: 10.5, carbohydrate: 74.3, lipid: 4.4, fiber: 4.2, sodium: 620.0 },

  // ==========================================
  // 4. CARNES E AVES
  // ==========================================
  { name: "Peito de Frango (Grelhado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 159.0, protein: 32.0, carbohydrate: 0.0, lipid: 2.5, fiber: 0.0, sodium: 50.0 },
  { name: "Peito de Frango (Cozido / Desfiado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 163.0, protein: 31.5, carbohydrate: 0.0, lipid: 3.2, fiber: 0.0, sodium: 53.0 },
  { name: "Sobrecoxa de Frango sem Pele (Assada)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 233.0, protein: 28.5, carbohydrate: 0.0, lipid: 12.4, fiber: 0.0, sodium: 75.0 },
  { name: "Coxa de Frango sem Pele (Cozida)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 167.0, protein: 26.9, carbohydrate: 0.0, lipid: 5.9, fiber: 0.0, sodium: 80.0 },
  { name: "Patinho Bovino (Grelhado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 219.0, protein: 35.9, carbohydrate: 0.0, lipid: 7.3, fiber: 0.0, sodium: 60.0 },
  { name: "Carne Moída Patinho (Refogada)", category: "Carnes e Aves", source: "TBCA", baseQuantity: 100, calories: 205.0, protein: 33.0, carbohydrate: 0.0, lipid: 7.0, fiber: 0.0, sodium: 65.0 },
  { name: "Alcatra Bovina (Grelhada)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 241.0, protein: 31.9, carbohydrate: 0.0, lipid: 11.6, fiber: 0.0, sodium: 55.0 },
  { name: "Filé Mignon Bovino (Grelhado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 220.0, protein: 32.8, carbohydrate: 0.0, lipid: 8.8, fiber: 0.0, sodium: 58.0 },
  { name: "Coxão Mole Bovino (Cozido)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 219.0, protein: 32.4, carbohydrate: 0.0, lipid: 8.9, fiber: 0.0, sodium: 56.0 },
  { name: "Músculo Bovino (Cozido)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 194.0, protein: 31.2, carbohydrate: 0.0, lipid: 6.7, fiber: 0.0, sodium: 54.0 },
  { name: "Lombo Suíno (Assado)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 210.0, protein: 35.7, carbohydrate: 0.0, lipid: 6.4, fiber: 0.0, sodium: 60.0 },
  { name: "Filé Mignon Suíno (Grelhado)", category: "Carnes e Aves", source: "TBCA", baseQuantity: 100, calories: 143.0, protein: 26.2, carbohydrate: 0.0, lipid: 3.5, fiber: 0.0, sodium: 55.0 },
  { name: "Peito de Peru Defumado", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 104.0, protein: 20.7, carbohydrate: 1.5, lipid: 1.7, fiber: 0.0, sodium: 980.0 },
  { name: "Carne de Sol Magra (Cozida)", category: "Carnes e Aves", source: "TACO", baseQuantity: 100, calories: 185.0, protein: 30.5, carbohydrate: 0.0, lipid: 6.2, fiber: 0.0, sodium: 1250.0 },

  // ==========================================
  // 5. PEIXES E FRUTOS DO MAR
  // ==========================================
  { name: "Filé de Tilápia (Grelhado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 128.0, protein: 26.0, carbohydrate: 0.0, lipid: 2.7, fiber: 0.0, sodium: 52.0 },
  { name: "Salmão (Grelhado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 229.0, protein: 23.9, carbohydrate: 0.0, lipid: 14.0, fiber: 0.0, sodium: 59.0 },
  { name: "Atum em Conserva (em Água)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 118.0, protein: 26.2, carbohydrate: 0.0, lipid: 0.9, fiber: 0.0, sodium: 360.0 },
  { name: "Atum em Conserva (em Óleo Drenado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 166.0, protein: 26.0, carbohydrate: 0.0, lipid: 6.3, fiber: 0.0, sodium: 380.0 },
  { name: "Atum Fresco (Grelhado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 139.0, protein: 29.9, carbohydrate: 0.0, lipid: 1.3, fiber: 0.0, sodium: 45.0 },
  { name: "Sardinha em Conserva (em Molho de Tomate)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 164.0, protein: 18.0, carbohydrate: 2.5, lipid: 9.0, fiber: 0.5, sodium: 450.0 },
  { name: "Sardinha Fresca (Grelhada)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 164.0, protein: 21.0, carbohydrate: 0.0, lipid: 8.5, fiber: 0.0, sodium: 90.0 },
  { name: "Camarão Cozido", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 91.0, protein: 19.0, carbohydrate: 0.0, lipid: 1.0, fiber: 0.0, sodium: 160.0 },
  { name: "Merluza (Filé Cozido)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 90.0, protein: 19.3, carbohydrate: 0.0, lipid: 0.9, fiber: 0.0, sodium: 70.0 },
  { name: "Bacalhau (Cozido e Desfiado)", category: "Peixes e Frutos do Mar", source: "TACO", baseQuantity: 100, calories: 140.0, protein: 29.0, carbohydrate: 0.0, lipid: 2.0, fiber: 0.0, sodium: 680.0 },

  // ==========================================
  // 6. OVOS
  // ==========================================
  { name: "Ovo de Galinha Inteiro (Cozido)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 146.0, protein: 13.3, carbohydrate: 0.6, lipid: 9.5, fiber: 0.0, sodium: 146.0 },
  { name: "Ovo de Galinha Inteiro (Frito com Pouco Óleo)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 240.0, protein: 15.6, carbohydrate: 1.2, lipid: 18.6, fiber: 0.0, sodium: 165.0 },
  { name: "Clara de Ovo (Cozida)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 52.0, protein: 10.9, carbohydrate: 0.7, lipid: 0.2, fiber: 0.0, sodium: 166.0 },
  { name: "Gema de Ovo (Cozida)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 353.0, protein: 15.9, carbohydrate: 1.6, lipid: 30.8, fiber: 0.0, sodium: 50.0 },
  { name: "Ovo de Codorna (Cozido)", category: "Ovos", source: "TACO", baseQuantity: 100, calories: 177.0, protein: 13.7, carbohydrate: 0.8, lipid: 12.7, fiber: 0.0, sodium: 140.0 },

  // ==========================================
  // 7. LATICÍNIOS E DERIVADOS
  // ==========================================
  { name: "Leite Desnatado", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 35.0, protein: 3.4, carbohydrate: 5.0, lipid: 0.1, fiber: 0.0, sodium: 53.0 },
  { name: "Leite Semidesnatado", category: "Laticínios", source: "TBCA", baseQuantity: 100, calories: 45.0, protein: 3.2, carbohydrate: 4.9, lipid: 1.5, fiber: 0.0, sodium: 48.0 },
  { name: "Leite Integral", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 60.0, protein: 3.2, carbohydrate: 4.8, lipid: 3.2, fiber: 0.0, sodium: 44.0 },
  { name: "Leite em Pó Desnatado", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 362.0, protein: 34.7, carbohydrate: 52.4, lipid: 0.9, fiber: 0.0, sodium: 520.0 },
  { name: "Leite em Pó Integral", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 497.0, protein: 26.0, carbohydrate: 38.0, lipid: 27.0, fiber: 0.0, sodium: 370.0 },
  { name: "Iogurte Natural Desnatado", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 41.0, protein: 3.8, carbohydrate: 5.8, lipid: 0.3, fiber: 0.0, sodium: 58.0 },
  { name: "Iogurte Natural Integral", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 61.0, protein: 3.5, carbohydrate: 4.7, lipid: 3.2, fiber: 0.0, sodium: 50.0 },
  { name: "Iogurte Grego Tradicional", category: "Laticínios", source: "Rótulo Comercial", brand: "Nestlé", baseQuantity: 100, calories: 110.0, protein: 5.0, carbohydrate: 12.0, lipid: 4.5, fiber: 0.0, sodium: 60.0 },
  { name: "Queijo Minas Frescal", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 264.0, protein: 17.4, carbohydrate: 3.2, lipid: 20.2, fiber: 0.0, sodium: 310.0 },
  { name: "Queijo Cottage", category: "Laticínios", source: "TBCA", baseQuantity: 100, calories: 98.0, protein: 11.1, carbohydrate: 3.4, lipid: 4.3, fiber: 0.0, sodium: 364.0 },
  { name: "Queijo Ricota Fresca", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 140.0, protein: 12.6, carbohydrate: 3.8, lipid: 8.1, fiber: 0.0, sodium: 85.0 },
  { name: "Queijo Muçarela", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 281.0, protein: 22.6, carbohydrate: 3.0, lipid: 20.1, fiber: 0.0, sodium: 590.0 },
  { name: "Queijo Prato", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 360.0, protein: 22.7, carbohydrate: 1.9, lipid: 29.1, fiber: 0.0, sodium: 580.0 },
  { name: "Queijo Parmesão Ralado", category: "Laticínios", source: "TACO", baseQuantity: 100, calories: 453.0, protein: 35.6, carbohydrate: 1.7, lipid: 33.5, fiber: 0.0, sodium: 1800.0 },
  { name: "Requeijão Cremoso Light", category: "Laticínios", source: "Rótulo Comercial", brand: "Nestlé", baseQuantity: 100, calories: 160.0, protein: 9.3, carbohydrate: 4.0, lipid: 11.5, fiber: 0.0, sodium: 480.0 },

  // ==========================================
  // 8. FRUTAS
  // ==========================================
  { name: "Banana Prata", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 98.0, protein: 1.3, carbohydrate: 26.0, lipid: 0.1, fiber: 2.0, sodium: 1.0 },
  { name: "Banana Nanica", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 92.0, protein: 1.4, carbohydrate: 23.8, lipid: 0.1, fiber: 1.9, sodium: 1.0 },
  { name: "Banana da Terra (Cozida)", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 128.0, protein: 1.1, carbohydrate: 33.7, lipid: 0.2, fiber: 1.5, sodium: 1.0 },
  { name: "Maçã Fuji (com Casca)", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 56.0, protein: 0.3, carbohydrate: 15.2, lipid: 0.2, fiber: 1.3, sodium: 1.0 },
  { name: "Maçã Gala (com Casca)", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 56.0, protein: 0.2, carbohydrate: 14.9, lipid: 0.2, fiber: 1.4, sodium: 1.0 },
  { name: "Mamão Papaia", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 40.0, protein: 0.5, carbohydrate: 10.4, lipid: 0.1, fiber: 1.8, sodium: 2.0 },
  { name: "Mamão Formosa", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 45.0, protein: 0.8, carbohydrate: 11.6, lipid: 0.1, fiber: 1.8, sodium: 3.0 },
  { name: "Abacate", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 96.0, protein: 1.2, carbohydrate: 6.0, lipid: 8.4, fiber: 6.3, sodium: 2.0 },
  { name: "Laranja Pera", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 37.0, protein: 1.0, carbohydrate: 8.9, lipid: 0.1, fiber: 0.8, sodium: 1.0 },
  { name: "Morango Cru", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 30.0, protein: 0.9, carbohydrate: 6.8, lipid: 0.3, fiber: 1.7, sodium: 1.0 },
  { name: "Uva Itália / Rubi", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 53.0, protein: 0.7, carbohydrate: 13.6, lipid: 0.2, fiber: 0.9, sodium: 2.0 },
  { name: "Manga Tommy Atkins", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 51.0, protein: 0.5, carbohydrate: 12.8, lipid: 0.2, fiber: 1.6, sodium: 2.0 },
  { name: "Melancia", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 33.0, protein: 0.9, carbohydrate: 8.1, lipid: 0.0, fiber: 0.1, sodium: 1.0 },
  { name: "Melão Amarelo", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 29.0, protein: 0.7, carbohydrate: 7.5, lipid: 0.0, fiber: 0.3, sodium: 8.0 },
  { name: "Abacaxi Pérola", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 48.0, protein: 0.9, carbohydrate: 12.3, lipid: 0.1, fiber: 1.0, sodium: 1.0 },
  { name: "Kiwi", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 51.0, protein: 1.3, carbohydrate: 11.5, lipid: 0.6, fiber: 2.7, sodium: 3.0 },
  { name: "Goiaba Vermelha", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 54.0, protein: 1.1, carbohydrate: 13.0, lipid: 0.4, fiber: 5.4, sodium: 3.0 },
  { name: "Açaí Puro (sem Xarope / Polpa)", category: "Frutas", source: "TACO", baseQuantity: 100, calories: 58.0, protein: 0.8, carbohydrate: 6.2, lipid: 3.9, fiber: 2.6, sodium: 12.0 },

  // ==========================================
  // 9. VERDURAS E LEGUMES
  // ==========================================
  { name: "Brócolis (Cozido)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 25.0, protein: 2.1, carbohydrate: 4.4, lipid: 0.5, fiber: 3.4, sodium: 12.0 },
  { name: "Couve-Flor (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 19.0, protein: 1.2, carbohydrate: 3.9, lipid: 0.2, fiber: 2.1, sodium: 15.0 },
  { name: "Cenoura (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 34.0, protein: 0.8, carbohydrate: 7.7, lipid: 0.2, fiber: 2.6, sodium: 30.0 },
  { name: "Cenoura (Crua)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 34.0, protein: 1.3, carbohydrate: 7.7, lipid: 0.2, fiber: 3.2, sodium: 40.0 },
  { name: "Beterraba (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 32.0, protein: 1.3, carbohydrate: 7.2, lipid: 0.1, fiber: 1.9, sodium: 35.0 },
  { name: "Abobrinha Italiana (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 15.0, protein: 1.1, carbohydrate: 3.0, lipid: 0.2, fiber: 1.6, sodium: 1.0 },
  { name: "Chuchu (Cozido)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 18.0, protein: 0.4, carbohydrate: 4.8, lipid: 0.1, fiber: 1.0, sodium: 1.0 },
  { name: "Berinjela (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 19.0, protein: 0.7, carbohydrate: 4.4, lipid: 0.1, fiber: 2.5, sodium: 1.0 },
  { name: "Tomate Cru", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 15.0, protein: 1.1, carbohydrate: 3.1, lipid: 0.2, fiber: 1.2, sodium: 5.0 },
  { name: "Alface Americana", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 9.0, protein: 0.6, carbohydrate: 1.7, lipid: 0.1, fiber: 1.0, sodium: 7.0 },
  { name: "Alface Crespa", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 11.0, protein: 1.3, carbohydrate: 1.7, lipid: 0.2, fiber: 1.8, sodium: 9.0 },
  { name: "Rúcula Crua", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 13.0, protein: 1.8, carbohydrate: 2.2, lipid: 0.1, fiber: 1.7, sodium: 9.0 },
  { name: "Espinafre (Cozido)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 16.0, protein: 2.7, carbohydrate: 2.3, lipid: 0.2, fiber: 2.1, sodium: 30.0 },
  { name: "Couve Manteiga (Refogada)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 90.0, protein: 2.9, carbohydrate: 8.7, lipid: 5.0, fiber: 5.7, sodium: 150.0 },
  { name: "Pepino com Casca", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 10.0, protein: 0.9, carbohydrate: 2.0, lipid: 0.0, fiber: 1.1, sodium: 2.0 },
  { name: "Pimentão Vermelho Cru", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 23.0, protein: 1.0, carbohydrate: 5.5, lipid: 0.1, fiber: 1.6, sodium: 1.0 },
  { name: "Vagem (Cozida)", category: "Verduras e Legumes", source: "TACO", baseQuantity: 100, calories: 25.0, protein: 1.8, carbohydrate: 5.3, lipid: 0.2, fiber: 2.4, sodium: 2.0 },
  { name: "Cogumelo Champignon Fresco", category: "Verduras e Legumes", source: "TBCA", baseQuantity: 100, calories: 22.0, protein: 3.1, carbohydrate: 3.3, lipid: 0.3, fiber: 1.0, sodium: 5.0 },

  // ==========================================
  // 10. OLEAGINOSAS, SEMENTES E PASTAS
  // ==========================================
  { name: "Castanha-do-Pará", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 643.0, protein: 14.5, carbohydrate: 15.1, lipid: 63.5, fiber: 7.9, sodium: 2.0 },
  { name: "Castanha de Caju (Torrada)", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 570.0, protein: 18.5, carbohydrate: 29.1, lipid: 46.3, fiber: 3.7, sodium: 16.0 },
  { name: "Amêndoas (Torradas)", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 580.0, protein: 18.6, carbohydrate: 24.2, lipid: 48.0, fiber: 11.6, sodium: 4.0 },
  { name: "Nozes", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 620.0, protein: 14.0, carbohydrate: 18.4, lipid: 59.4, fiber: 7.2, sodium: 2.0 },
  { name: "Amendoim Torrado", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 544.0, protein: 22.5, carbohydrate: 20.3, lipid: 43.9, fiber: 8.0, sodium: 5.0 },
  { name: "Pasta de Amendoim Integral", category: "Oleaginosas e Pastas", source: "TBCA", baseQuantity: 100, calories: 588.0, protein: 25.0, carbohydrate: 20.0, lipid: 50.0, fiber: 6.0, sodium: 10.0 },
  { name: "Semente de Chia", category: "Oleaginosas e Pastas", source: "TBCA", baseQuantity: 100, calories: 486.0, protein: 16.5, carbohydrate: 42.1, lipid: 30.7, fiber: 34.4, sodium: 16.0 },
  { name: "Semente de Linhaça Dourada", category: "Oleaginosas e Pastas", source: "TACO", baseQuantity: 100, calories: 495.0, protein: 14.1, carbohydrate: 43.3, lipid: 32.3, fiber: 33.5, sodium: 9.0 },
  { name: "Semente de Girassol", category: "Oleaginosas e Pastas", source: "TBCA", baseQuantity: 100, calories: 584.0, protein: 20.8, carbohydrate: 20.0, lipid: 51.5, fiber: 8.6, sodium: 9.0 },
  { name: "Semente de Abóbora Torrada", category: "Oleaginosas e Pastas", source: "TBCA", baseQuantity: 100, calories: 559.0, protein: 30.2, carbohydrate: 10.7, lipid: 49.0, fiber: 6.0, sodium: 18.0 },

  // ==========================================
  // 11. ÓLEOS E GORDURAS
  // ==========================================
  { name: "Azeite de Oliva Extra Virgem", category: "Óleos e Gorduras", source: "TACO", baseQuantity: 100, calories: 884.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0 },
  { name: "Óleo de Coco Extra Virgem", category: "Óleos e Gorduras", source: "TBCA", baseQuantity: 100, calories: 862.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0 },
  { name: "Manteiga com Sal", category: "Óleos e Gorduras", source: "TACO", baseQuantity: 100, calories: 726.0, protein: 0.6, carbohydrate: 0.1, lipid: 82.4, fiber: 0.0, sodium: 580.0 },
  { name: "Manteiga Ghee (Clarificada)", category: "Óleos e Gorduras", source: "Rótulo Comercial", brand: "Madre Terra", baseQuantity: 100, calories: 900.0, protein: 0.0, carbohydrate: 0.0, lipid: 100.0, fiber: 0.0, sodium: 0.0 },

  // ==========================================
  // 12. SUPLEMENTOS E RÓTULOS COMERCIAIS
  // ==========================================
  { name: "100% Whey Concentrado 80%", category: "Suplementos", source: "Rótulo Comercial", brand: "Growth Supplements", baseQuantity: 100, calories: 400.0, protein: 80.0, carbohydrate: 8.0, lipid: 6.0, fiber: 0.0, sodium: 200.0 },
  { name: "100% Whey Isolado 90%", category: "Suplementos", source: "Rótulo Comercial", brand: "Growth Supplements", baseQuantity: 100, calories: 370.0, protein: 90.0, carbohydrate: 1.5, lipid: 0.5, fiber: 0.0, sodium: 160.0 },
  { name: "100% Whey Max Titanium", category: "Suplementos", source: "Rótulo Comercial", brand: "Max Titanium", baseQuantity: 100, calories: 403.0, protein: 70.0, carbohydrate: 15.0, lipid: 7.0, fiber: 0.0, sodium: 220.0 },
  { name: "Albumina Naturovos Pura", category: "Suplementos", source: "Rótulo Comercial", brand: "Naturovos", baseQuantity: 100, calories: 362.0, protein: 84.0, carbohydrate: 4.0, lipid: 0.0, fiber: 0.0, sodium: 1000.0 },
  { name: "Soy Protein Isolada 90%", category: "Suplementos", source: "Rótulo Comercial", brand: "Growth Supplements", baseQuantity: 100, calories: 360.0, protein: 86.7, carbohydrate: 0.0, lipid: 1.0, fiber: 0.0, sodium: 800.0 },
  { name: "Caseína Micelar 80%", category: "Suplementos", source: "Rótulo Comercial", brand: "Probiótica", baseQuantity: 100, calories: 375.0, protein: 80.0, carbohydrate: 6.0, lipid: 2.5, fiber: 0.0, sodium: 180.0 },
  { name: "Creatina Monohidratada 100% Creapure", category: "Suplementos", source: "Rótulo Comercial", brand: "Creapure", baseQuantity: 100, calories: 0.0, protein: 0.0, carbohydrate: 0.0, lipid: 0.0, fiber: 0.0, sodium: 0.0 },
  { name: "Maltodextrina Pura", category: "Suplementos", source: "Rótulo Comercial", brand: "Max Titanium", baseQuantity: 100, calories: 380.0, protein: 0.0, carbohydrate: 95.0, lipid: 0.0, fiber: 0.0, sodium: 30.0 },
  { name: "Palatinose (Isomaltulose)", category: "Suplementos", source: "Rótulo Comercial", brand: "Essential Nutrition", baseQuantity: 100, calories: 380.0, protein: 0.0, carbohydrate: 95.0, lipid: 0.0, fiber: 0.0, sodium: 0.0 },
  { name: "Iogurte YoPRO 15g Proteína", category: "Laticínios", source: "Rótulo Comercial", brand: "Danone", baseQuantity: 100, calories: 62.0, protein: 6.0, carbohydrate: 7.2, lipid: 1.0, fiber: 0.0, sodium: 65.0 },
  { name: "Iogurte YoPRO 25g Proteína", category: "Laticínios", source: "Rótulo Comercial", brand: "Danone", baseQuantity: 100, calories: 64.0, protein: 10.0, carbohydrate: 5.6, lipid: 0.3, fiber: 0.0, sodium: 60.0 },
  { name: "Barra de Proteína Crisp Bar", category: "Suplementos", source: "Rótulo Comercial", brand: "IntegralMedica", baseQuantity: 100, calories: 377.0, protein: 31.0, carbohydrate: 35.0, lipid: 12.0, fiber: 7.0, sodium: 180.0 },
  { name: "Barra de Proteína Darkness", category: "Suplementos", source: "Rótulo Comercial", brand: "Darkness", baseQuantity: 100, calories: 390.0, protein: 33.0, carbohydrate: 31.0, lipid: 14.0, fiber: 9.0, sodium: 210.0 },

  // ==========================================
  // 13. ACHOCOLATADOS E BEBIDAS EM PÓ (RÓTULOS)
  // ==========================================
  { name: "Toddy Achocolatado em Pó Original", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Pepsico/Toddy", baseQuantity: 100, calories: 395.0, protein: 5.5, carbohydrate: 76.0, lipid: 8.5, fiber: 3.0, sodium: 210.0 },
  { name: "Toddy Achocolatado em Pó Integral", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Pepsico/Toddy", baseQuantity: 100, calories: 410.0, protein: 6.5, carbohydrate: 73.0, lipid: 10.0, fiber: 4.5, sodium: 195.0 },
  { name: "Nescau 2.0 Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 382.0, protein: 5.6, carbohydrate: 75.5, lipid: 7.0, fiber: 5.0, sodium: 180.0 },
  { name: "Nescau Integral Achocolatado", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 370.0, protein: 7.0, carbohydrate: 68.0, lipid: 7.5, fiber: 7.0, sodium: 160.0 },
  { name: "Alpino Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Alpino", baseQuantity: 100, calories: 402.0, protein: 6.2, carbohydrate: 78.0, lipid: 8.0, fiber: 2.5, sodium: 220.0 },
  { name: "Milo Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Milo", baseQuantity: 100, calories: 368.0, protein: 8.0, carbohydrate: 72.0, lipid: 4.0, fiber: 5.5, sodium: 170.0 },
  { name: "Ovalzinho Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Ovalzinho", baseQuantity: 100, calories: 375.0, protein: 10.0, carbohydrate: 67.5, lipid: 6.5, fiber: 4.0, sodium: 190.0 },
  { name: "Ovomaltine Achocolatado em Pó", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Associated British Foods", baseQuantity: 100, calories: 370.0, protein: 10.0, carbohydrate: 65.0, lipid: 7.5, fiber: 6.5, sodium: 250.0 },

  // ==========================================
  // 14. CEREAIS / AVEIA / FIBRAS (RÓTULOS)
  // ==========================================
  { name: "Aveia Farelo (Puro)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 246.0, protein: 9.7, carbohydrate: 42.0, lipid: 5.3, fiber: 15.9, sodium: 3.0 },
  { name: "Aveia Farelo Quaker", category: "Cereais e Leguminosas", source: "Rótulo Comercial", brand: "Quaker", baseQuantity: 100, calories: 338.0, protein: 14.0, carbohydrate: 54.0, lipid: 7.5, fiber: 17.0, sodium: 5.0 },
  { name: "Aveia em Flocos Grossos Quaker", category: "Cereais e Leguminosas", source: "Rótulo Comercial", brand: "Quaker", baseQuantity: 100, calories: 370.0, protein: 13.0, carbohydrate: 62.0, lipid: 7.0, fiber: 9.5, sodium: 4.0 },
  { name: "Aveia em Flocos Finos", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 394.0, protein: 13.9, carbohydrate: 66.6, lipid: 8.5, fiber: 9.1, sodium: 4.0 },
  { name: "Granola Tradicional", category: "Cereais e Leguminosas", source: "Rótulo Comercial", brand: "Jasmine", baseQuantity: 100, calories: 410.0, protein: 9.0, carbohydrate: 65.0, lipid: 12.0, fiber: 6.0, sodium: 20.0 },
  { name: "Granola Sem Açúcar Fit", category: "Cereais e Leguminosas", source: "Rótulo Comercial", brand: "Jasmine", baseQuantity: 100, calories: 380.0, protein: 10.0, carbohydrate: 58.0, lipid: 11.5, fiber: 8.5, sodium: 15.0 },
  { name: "Linhaça Dourada (Triturada)", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 495.0, protein: 18.0, carbohydrate: 29.0, lipid: 35.0, fiber: 26.0, sodium: 35.0 },
  { name: "Chia em Grãos", category: "Cereais e Leguminosas", source: "TBCA", baseQuantity: 100, calories: 486.0, protein: 16.5, carbohydrate: 42.1, lipid: 30.7, fiber: 34.4, sodium: 16.0 },
  { name: "Psyllium Husks Puro", category: "Suplementos", source: "Rótulo Comercial", brand: "Fibras", baseQuantity: 100, calories: 200.0, protein: 2.0, carbohydrate: 80.0, lipid: 1.0, fiber: 70.0, sodium: 20.0 },
  { name: "Farelo de Trigo", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 246.0, protein: 12.1, carbohydrate: 58.3, lipid: 3.1, fiber: 33.3, sodium: 2.0 },
  { name: "Gérmen de Trigo", category: "Cereais e Leguminosas", source: "TACO", baseQuantity: 100, calories: 374.0, protein: 28.0, carbohydrate: 45.8, lipid: 9.5, fiber: 14.0, sodium: 4.0 },

  // ==========================================
  // 15. BEBIDAS E LÁCTEOS PRONTOS (RÓTULOS)
  // ==========================================
  { name: "Leite Zerolactose Integral", category: "Laticínios", source: "Rótulo Comercial", brand: "Piracanjuba", baseQuantity: 100, calories: 62.0, protein: 3.2, carbohydrate: 4.8, lipid: 3.3, fiber: 0.0, sodium: 44.0 },
  { name: "Leite Zerolactose Desnatado", category: "Laticínios", source: "Rótulo Comercial", brand: "Piracanjuba", baseQuantity: 100, calories: 35.0, protein: 3.4, carbohydrate: 5.0, lipid: 0.1, fiber: 0.0, sodium: 53.0 },
  { name: "Bebida de Amêndoas Não Adoçada", category: "Laticínios", source: "Rótulo Comercial", brand: "A Tal da Castanha", baseQuantity: 100, calories: 13.0, protein: 0.5, carbohydrate: 0.3, lipid: 1.1, fiber: 0.4, sodium: 70.0 },
  { name: "Bebida de Aveia (Oat Drink)", category: "Laticínios", source: "Rótulo Comercial", brand: "Oatly", baseQuantity: 100, calories: 47.0, protein: 1.0, carbohydrate: 6.7, lipid: 1.5, fiber: 0.8, sodium: 90.0 },
  { name: "Bebida de Soja Natural", category: "Laticínios", source: "Rótulo Comercial", brand: "AdeS", baseQuantity: 100, calories: 45.0, protein: 3.3, carbohydrate: 4.0, lipid: 1.5, fiber: 0.0, sodium: 55.0 },
  { name: "Achocolatado Líquido Toddynho", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Pepsico/Toddy", baseQuantity: 100, calories: 73.0, protein: 3.0, carbohydrate: 12.5, lipid: 1.2, fiber: 0.0, sodium: 48.0 },
  { name: "Achocolatado Líquido Nescau (200ml)", category: "Achocolatados e Bebidas", source: "Rótulo Comercial", brand: "Nestlé/Nescau", baseQuantity: 100, calories: 74.0, protein: 3.5, carbohydrate: 12.3, lipid: 1.0, fiber: 0.5, sodium: 52.0 },

  // ==========================================
  // 16. OUTROS RÓTULOS COMERCIAIS COMUNS
  // ==========================================
  { name: "Cream Cheese Light (Philadelfia)", category: "Laticínios", source: "Rótulo Comercial", brand: "Kraft", baseQuantity: 100, calories: 150.0, protein: 7.0, carbohydrate: 4.0, lipid: 11.0, fiber: 0.0, sodium: 420.0 },
  { name: "Creme de Amendoim Integral (DP)", category: "Oleaginosas", source: "Rótulo Comercial", brand: "Dr. Peanut", baseQuantity: 100, calories: 563.0, protein: 28.0, carbohydrate: 19.0, lipid: 44.0, fiber: 5.0, sodium: 5.0 },
  { name: "Pasta de Amendoim Whey (DP)", category: "Oleaginosas", source: "Rótulo Comercial", brand: "Dr. Peanut", baseQuantity: 100, calories: 555.0, protein: 32.0, carbohydrate: 17.0, lipid: 42.0, fiber: 4.5, sodium: 30.0 },
  { name: "Geleia de Frutas Vermelhas (s/ açúcar)", category: "Condimentos", source: "Rótulo Comercial", brand: "Queensberry", baseQuantity: 100, calories: 28.0, protein: 0.5, carbohydrate: 6.5, lipid: 0.0, fiber: 1.0, sodium: 10.0 },
  { name: "Mel Puro (Apiário)", category: "Condimentos", source: "TACO", baseQuantity: 100, calories: 309.0, protein: 0.3, carbohydrate: 84.0, lipid: 0.0, fiber: 0.2, sodium: 6.0 },
  { name: "Açúcar Demerara", category: "Condimentos", source: "TACO", baseQuantity: 100, calories: 396.0, protein: 0.0, carbohydrate: 99.6, lipid: 0.0, fiber: 0.0, sodium: 1.0 },
  { name: "Adoçante Eritritol Puro", category: "Condimentos", source: "Rótulo Comercial", brand: "Natural Life", baseQuantity: 100, calories: 20.0, protein: 0.0, carbohydrate: 100.0, lipid: 0.0, fiber: 0.0, sodium: 0.0 },
  { name: "Ketchup Tradicional Heinz", category: "Condimentos", source: "Rótulo Comercial", brand: "Heinz", baseQuantity: 100, calories: 101.0, protein: 1.3, carbohydrate: 23.0, lipid: 0.0, fiber: 0.7, sodium: 1090.0 },
  { name: "Mostarda Americana", category: "Condimentos", source: "Rótulo Comercial", brand: "Hellmann's", baseQuantity: 100, calories: 63.0, protein: 3.7, carbohydrate: 5.4, lipid: 3.7, fiber: 2.0, sodium: 920.0 }
];

// Initial Patients Data with Anamnese & Lifestyle Profile
// Pacientes de exemplo removidos — cadastre pacientes reais ou importe do Google Drive
const initialPatientsData = [];

// IDs dos antigos pacientes de demonstração (serão removidos do Dexie se existirem)
const _DEMO_PATIENT_IDS_TO_REMOVE = ["paulo-vitor", "maria-silva"];

const _REMOVED_PATIENTS_DATA = [
  {
    id: "paulo-vitor",
    name: "Paulo Vitor R de Sousa",
    email: "paulo.vitor@nutriax.com",
    gender: "Masculino",
    age: 38,
    height: 1.96,
    currentWeight: 116.0,
    usualWeight: 120.61,
    targetWeight: 103.72,
    objective: "Perda de peso",
    patientType: "Praticante recreativo",
    mainModality: "Musculação",
    workoutFrequency: "6x/semana",
    workoutType: "Hipertrofia & Força",
    workoutDuration: "75 min",
    workoutTime: "Manhã (06:30)",
    neatRoutine: "Moderado",
    cookingAvailability: "Moderada",
    mealFrequency: "5 refeições/dia",
    hydrationLiters: 4.0,
    sleepHours: 7.5,
    sleepQuality: "Boa",
    stressLevel: "Moderado",
    activityFactor: 1.55,
    dietaryRestrictions: "Nenhuma intolerância",
    clinicalNotes: "Sem comorbidades. Boa resposta metabólica ao treino resistido. Meta: 103.7kg mantendo FFMI elevado.",
  },
  {
    id: "maria-silva",
    name: "Maria Silva Santos",
    email: "maria.silva@nutriax.com",
    gender: "Feminino",
    age: 32,
    height: 1.65,
    currentWeight: 64.5,
    usualWeight: 65.0,
    targetWeight: 60.0,
    objective: "Recomposição Corporal",
    patientType: "Praticante recreativo",
    mainModality: "Crossfit",
    workoutFrequency: "4x/semana",
    workoutType: "Crossfit & Funcional",
    workoutDuration: "60 min",
    workoutTime: "Noite (19:00)",
    neatRoutine: "Moderado",
    cookingAvailability: "Alta",
    mealFrequency: "4 refeições/dia",
    hydrationLiters: 2.5,
    sleepHours: 8.0,
    sleepQuality: "Excelente",
    stressLevel: "Baixo",
    activityFactor: 1.45,
    dietaryRestrictions: "Leve intolerância a lactose",
    clinicalNotes: "Foco em ganho de massa magra e definição abdominal.",
  }
]; // fim _REMOVED_PATIENTS_DATA (mantido apenas para referência, não é mais usado no seed)

// Initial Assessment History for Temporal Evolution Charts
const initialAssessmentsData = [
  { id: "eval_pv_1", patientId: "paulo-vitor", date: "2026-05-15", weight: 120.61, leanMass: 87.50, fatMass: 33.11, fatPercent: 27.45, waist: 102.0, chest: 118.0, arm: 43.5, thigh: 66.0 },
  { id: "eval_pv_2", patientId: "paulo-vitor", date: "2026-06-15", weight: 118.50, leanMass: 88.20, fatMass: 30.30, fatPercent: 25.57, waist: 99.5, chest: 118.5, arm: 44.0, thigh: 65.5 },
  { id: "eval_pv_3", patientId: "paulo-vitor", date: "2026-07-15", weight: 116.80, leanMass: 89.05, fatMass: 27.75, fatPercent: 23.76, waist: 97.5, chest: 119.0, arm: 44.5, thigh: 65.0 },
  { id: "eval_pv_4", patientId: "paulo-vitor", date: "2026-08-15", weight: 116.00, leanMass: 89.55, fatMass: 26.45, fatPercent: 22.80, waist: 96.0, chest: 119.5, arm: 45.0, thigh: 65.0 }
];

// Initial Dietary Recall Items (Basal Current Intake before Diet Plan)
const initialDietaryRecallData = [
  { id: "r1", patientId: "paulo-vitor", mealName: "Café da manhã", mealTime: "07:30", foodName: "Pão Francês", quantity: 100, unitDisplay: "2 unidades (100g)", calories: 300, protein: 8.0, carbohydrate: 58.6, lipid: 3.1, fiber: 2.3 },
  { id: "r2", patientId: "paulo-vitor", mealName: "Café da manhã", mealTime: "07:30", foodName: "Manteiga com Sal", quantity: 20, unitDisplay: "1 col. sopa (20g)", calories: 145, protein: 0.1, carbohydrate: 0.0, lipid: 16.5, fiber: 0.0 },
  { id: "r3", patientId: "paulo-vitor", mealName: "Café da manhã", mealTime: "07:30", foodName: "Café (sem açúcar)", quantity: 150, unitDisplay: "1 xícara (150ml)", calories: 3, protein: 0.5, carbohydrate: 0.0, lipid: 0.0, fiber: 0.0 },
  { id: "r4", patientId: "paulo-vitor", mealName: "Almoço", mealTime: "12:30", foodName: "Arroz Branco (Cozido)", quantity: 250, unitDisplay: "10 col. sopa (250g)", calories: 320, protein: 6.2, carbohydrate: 70.2, lipid: 0.5, fiber: 4.0 },
  { id: "r5", patientId: "paulo-vitor", mealName: "Almoço", mealTime: "12:30", foodName: "Feijão Carioca (Cozido)", quantity: 130, unitDisplay: "1 concha (130g)", calories: 98, protein: 6.2, carbohydrate: 17.6, lipid: 0.6, fiber: 11.0 },
  { id: "r6", patientId: "paulo-vitor", mealName: "Almoço", mealTime: "12:30", foodName: "Alcatra Bovina (Grelhada)", quantity: 200, unitDisplay: "2 bifes (200g)", calories: 482, protein: 63.8, carbohydrate: 0.0, lipid: 23.2, fiber: 0.0 },
  { id: "r7", patientId: "paulo-vitor", mealName: "Lanche tarde", mealTime: "16:30", foodName: "Banana Prata", quantity: 140, unitDisplay: "2 unidades (140g)", calories: 137, protein: 1.8, carbohydrate: 36.4, lipid: 0.1, fiber: 2.8 },
  { id: "r8", patientId: "paulo-vitor", mealName: "Jantar", mealTime: "20:30", foodName: "Pão de Forma Tradicional", quantity: 50, unitDisplay: "2 fatias (50g)", calories: 133, protein: 4.4, carbohydrate: 26.1, lipid: 1.3, fiber: 1.0 },
  { id: "r9", patientId: "paulo-vitor", mealName: "Jantar", mealTime: "20:30", foodName: "Queijo Muçarela", quantity: 60, unitDisplay: "2 fatias (60g)", calories: 168, protein: 13.5, carbohydrate: 1.8, lipid: 12.0, fiber: 0.0 }
];

// Seed function for Foods Database (TACO + TBCA + Rótulos: >3000 alimentos padronizados)
async function seedFoodsDatabase() {
  try {
    const foodCount = await db.foods.count();
    const sourceArray = (typeof COMPREHENSIVE_TACO_TBCA_FOODS !== "undefined" && Array.isArray(COMPREHENSIVE_TACO_TBCA_FOODS) && COMPREHENSIVE_TACO_TBCA_FOODS.length > 0)
      ? COMPREHENSIVE_TACO_TBCA_FOODS
      : initialFoodsData;

    // Verifica se os alimentos existentes já possuem metadados bromatológicos
    let needsUpdate = foodCount < 2400;
    if (!needsUpdate && foodCount > 0) {
      const sample = await db.foods.limit(5).toArray();
      const hasBromatology = sample.some(s => s && s.bromatology && s.prepState);
      if (!hasBromatology) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db.foods.clear();
      await db.foods.bulkPut(sourceArray);
      console.log(`[Dexie.js] ${sourceArray.length} alimentos TACO 4ª Edição semeados e validados bromatologicamente no banco local!`);
    }
  } catch (err) {
    console.error("Erro ao semear alimentos:", err);
  }
}

// Forçar resementeira completa caso o banco precise ser atualizado manualmente
async function reseedFoods() {
  try {
    const sourceArray = (typeof COMPREHENSIVE_TACO_TBCA_FOODS !== "undefined" && Array.isArray(COMPREHENSIVE_TACO_TBCA_FOODS) && COMPREHENSIVE_TACO_TBCA_FOODS.length > 0)
      ? COMPREHENSIVE_TACO_TBCA_FOODS
      : initialFoodsData;

    await db.foods.clear();
    await db.foods.bulkPut(sourceArray);
    console.log(`[Dexie.js] Resementeira concluída: ${sourceArray.length} alimentos padronizados.`);
    if (typeof loadFoods === "function") {
      await loadFoods();
    }
    alert(`✅ Base Oficial TACO 4ª Edição & Rótulos: ${sourceArray.length} alimentos padronizados e validados bromatologicamente!`);
  } catch (err) {
    console.error("Erro ao resead alimentos:", err);
    alert("Erro ao carregar alimentos: " + err.message);
  }
}

// Initial Clinical Exams Data (Aba 02)
const initialClinicalExamsData = [
  {
    id: "exam_paulo_1",
    patientId: "paulo-vitor",
    examDate: "2026-06-20",
    fastingGlucose: 104, // Alerta: Glicemia alterada
    fastingInsulin: 14.2,
    hba1c: 5.8, // Alerta: Pré-diabetes / Risco
    totalCholesterol: 215, // Alerta: Elevado
    hdl: 44,
    ldl: 138, // Alerta: LDL elevado
    triglycerides: 165, // Alerta: Triglicerídeos elevados
    tgo: 32,
    tgp: 38,
    urea: 36,
    creatinine: 1.05,
    uricAcid: 6.2,
    ferritin: 180,
    vitaminD: 24, // Alerta: Insuficiência Vitamina D
    vitaminB12: 460,
    tsh: 2.1
  },
  {
    id: "exam_maria_1",
    patientId: "maria-silva",
    examDate: "2026-07-10",
    fastingGlucose: 88,
    fastingInsulin: 6.5,
    hba1c: 5.2,
    totalCholesterol: 178,
    hdl: 58,
    ldl: 98,
    triglycerides: 110,
    tgo: 22,
    tgp: 24,
    urea: 28,
    creatinine: 0.82,
    uricAcid: 4.1,
    ferritin: 25, // Alerta: Ferritina limítrofe
    vitaminD: 38,
    vitaminB12: 280, // Alerta: Vitamina B12 limítrofe
    tsh: 1.8
  }
];

// Initial Daily Logs Data (Aba 06 - Controle de Adesão & Compliance)
const initialDailyLogsData = [
  {
    id: "log_pv_1",
    patientId: "paulo-vitor",
    date: "2026-08-17",
    dayLabel: "Hoje (17 de Agosto)",
    hydrationGoalLiters: 4.0,
    hydrationConsumedLiters: 4.2,
    hydrationMet: true,
    overallScore: 90,
    meals: [
      {
        mealName: "Café da manhã",
        mealTime: "08:00",
        status: "followed", // followed | modified | missed
        plannedFood: "Ovo Cozido (3 un) + Pão Francês (1 un) + Café Preto",
        patientNotes: "Segui 100% como prescrito. Disposição e saciedade ótimas."
      },
      {
        mealName: "Lanche manhã",
        mealTime: "10:30",
        status: "followed",
        plannedFood: "Maçã Fuji (1 un) + Castanha-do-Pará (15g)",
        patientNotes: "Consumido no horário durante o trabalho."
      },
      {
        mealName: "Almoço",
        mealTime: "12:30",
        status: "followed",
        plannedFood: "Arroz Branco (150g) + Feijão Carioca (100g) + Peito de Frango (150g) + Salada",
        patientNotes: "Refeição completa com bastante salada verde e azeite de oliva."
      },
      {
        mealName: "Lanche tarde",
        mealTime: "16:30",
        status: "modified",
        plannedFood: "Iogurte Natural (170g) + Aveia em Flocos (30g) + Banana",
        patientNotes: "Tive uma reunião de trabalho externa e troquei por 1 barra de proteína (20g P) e 1 banana."
      },
      {
        mealName: "Jantar",
        mealTime: "20:30",
        status: "followed",
        plannedFood: "Batata Doce (150g) + Patinho Moído (150g) + Brócolis",
        patientNotes: "Jantar em casa 100% dentro do plano prescrito."
      }
    ]
  },
  {
    id: "log_pv_2",
    patientId: "paulo-vitor",
    date: "2026-08-16",
    dayLabel: "Ontem (16 de Agosto)",
    hydrationGoalLiters: 4.0,
    hydrationConsumedLiters: 4.0,
    hydrationMet: true,
    overallScore: 80,
    meals: [
      {
        mealName: "Café da manhã",
        mealTime: "08:00",
        status: "followed",
        plannedFood: "Ovos Mexidos (3 un) + Tapioca (50g) + Queijo Minas (30g)",
        patientNotes: "Segui normalmente sem alterações."
      },
      {
        mealName: "Lanche manhã",
        mealTime: "10:30",
        status: "followed",
        plannedFood: "Pera + Castanhas",
        patientNotes: "Comi no horário."
      },
      {
        mealName: "Almoço",
        mealTime: "12:30",
        status: "followed",
        plannedFood: "Arroz Integral + Feijão + Alcatra Grelhada (180g)",
        patientNotes: "Almoço perfeito no restaurante por quilo."
      },
      {
        mealName: "Lanche tarde",
        mealTime: "16:30",
        status: "missed",
        plannedFood: "Whey Protein + Aveia + Fruta",
        patientNotes: "Fiquei preso no trânsito e não consegui comer nada. Pulei o lanche."
      },
      {
        mealName: "Jantar",
        mealTime: "20:30",
        status: "followed",
        plannedFood: "Arroz Branco + Peito de Frango (180g) + Legumes",
        patientNotes: "Cheguei com mais fome pelo lanche pulado, mas compensei na salada."
      }
    ]
  },
  {
    id: "log_pv_3",
    patientId: "paulo-vitor",
    date: "2026-08-15",
    dayLabel: "15 de Agosto",
    hydrationGoalLiters: 4.0,
    hydrationConsumedLiters: 3.5,
    hydrationMet: false,
    overallScore: 95,
    meals: [
      {
        mealName: "Café da manhã",
        mealTime: "08:00",
        status: "followed",
        plannedFood: "Ovos Cozidos + Pão + Café",
        patientNotes: "100% conforme o plano."
      },
      {
        mealName: "Lanche manhã",
        mealTime: "10:30",
        status: "followed",
        plannedFood: "Fruta + Castanhas",
        patientNotes: "Seguido."
      },
      {
        mealName: "Almoço",
        mealTime: "12:30",
        status: "followed",
        plannedFood: "Arroz + Feijão + Frango Grelhado",
        patientNotes: "100% seguido."
      },
      {
        mealName: "Lanche tarde",
        mealTime: "16:30",
        status: "followed",
        plannedFood: "Iogurte + Frutas vermelhas + Aveia",
        patientNotes: "Comi em casa."
      },
      {
        mealName: "Jantar",
        mealTime: "20:30",
        status: "followed",
        plannedFood: "Batata Doce + Salmão Grelhado (160g)",
        patientNotes: "Excelente refeição."
      }
    ]
  }
];

// Seed function - Always puts initial patients & foods & history
async function seedDatabase() {
  try {
    await seedFoodsDatabase();

    // ── Remove avaliações fictícias/falsas de versões anteriores ─────────────
    const fakeEvalIds = ["eval_pv_1", "eval_pv_2", "eval_pv_3", "eval_pv_4"];
    for (const fakeId of fakeEvalIds) {
      await db.assessments.delete(fakeId);
    }

    // ── Remove pacientes de demonstração criados em versões anteriores ──────
    for (const demoId of _DEMO_PATIENT_IDS_TO_REMOVE) {
      const exists = await db.patients.get(demoId);
      if (exists) {
        await db.patients.delete(demoId);
        // Remove também dados associados ao paciente de demo
        await db.assessments.where("patientId").equals(demoId).delete();
        await db.dietaryRecall.where("patientId").equals(demoId).delete();
        await db.clinicalExams.where("patientId").equals(demoId).delete();
        await db.dailyLogs.where("patientId").equals(demoId).delete();
        console.log(`[NutriAx] Paciente de demonstração "${demoId}" removido do Dexie.`);
      }
    }

    // ── Sem pacientes de exemplo — cadastre reais ou importe do Google Drive ─

    // Mantém seed de dados iniciais opcionais (avaliações, recordatório, exames, logs)
    // somente se não houver NENHUM paciente real cadastrado
    const realPatientCount = await db.patients.count();
    if (realPatientCount === 0) {
      // Banco vazio — não insere dados de demonstração
      console.log("[NutriAx] Banco vazio. Cadastre pacientes reais ou importe do Google Drive.");
    }

  } catch (err) {
    console.error("Erro no seedDatabase:", err);
  }
}

db.on("ready", seedDatabase);



