export interface SchoolGrade {
  value: string;
  label: string;
  age?: number;
  level?: 'preschool' | 'care' | 'primary' | 'secondary1' | 'secondary2';
  schoolType?: string; // Für DE: 'hauptschule' | 'realschule' | 'gymnasium' | 'gesamtschule'
  careType?: 'spielgruppe' | 'kita' | 'kindergarten' | 'hort';
}

export const countrySchoolGrades: Record<string, SchoolGrade[]> = {
  CH: [
    // Vorschule und Betreuung
    { value: 'spielgruppe', label: 'Spielgruppe', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'kita', label: 'Kita / Kindertagesstätte', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'kindergarten', label: 'Kindergarten', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'hort', label: 'Hort (Nachmittagsbetreuung)', age: 6, level: 'care', careType: 'hort' },
    // Primarstufe
    { value: '1', label: '1. Klasse', age: 6, level: 'primary' },
    { value: '2', label: '2. Klasse', age: 7, level: 'primary' },
    { value: '3', label: '3. Klasse', age: 8, level: 'primary' },
    { value: '4', label: '4. Klasse', age: 9, level: 'primary' },
    { value: '5', label: '5. Klasse', age: 10, level: 'primary' },
    { value: '6', label: '6. Klasse', age: 11, level: 'primary' },
    // Sekundarstufe I (Oberstufe)
    { value: '7', label: '7. Klasse (Oberstufe)', age: 12, level: 'secondary1' },
    { value: '8', label: '8. Klasse (Oberstufe)', age: 13, level: 'secondary1' },
    { value: '9', label: '9. Klasse (Oberstufe)', age: 14, level: 'secondary1' },
    // Sekundarstufe II (Gymnasium, Berufsschule, etc.)
    { value: '10', label: '10. Klasse (Gymnasium, Berufsschule, etc.)', age: 15, level: 'secondary2' },
    { value: '11', label: '11. Klasse (Gymnasium, Berufsschule, etc.)', age: 16, level: 'secondary2' },
    { value: '12', label: '12. Klasse (Gymnasium, Berufsschule, etc.)', age: 17, level: 'secondary2' },
    { value: '13', label: '13. Klasse (Gymnasium, Berufsschule, etc.)', age: 18, level: 'secondary2' },
  ],
  DE: [
    // Vorschule und Betreuung
    { value: 'spielgruppe', label: 'Spielgruppe', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'kita', label: 'Kita / Kindertagesstätte', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'kindergarten', label: 'Kindergarten', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'hort', label: 'Hort (Nachmittagsbetreuung)', age: 6, level: 'care', careType: 'hort' },
    // Grundschule
    { value: '1', label: '1. Klasse (Grundschule)', age: 6, level: 'primary' },
    { value: '2', label: '2. Klasse (Grundschule)', age: 7, level: 'primary' },
    { value: '3', label: '3. Klasse (Grundschule)', age: 8, level: 'primary' },
    { value: '4', label: '4. Klasse (Grundschule)', age: 9, level: 'primary' },
    // Sekundarstufe I - Hauptschule
    { value: '5_haupt', label: '5. Klasse (Hauptschule)', age: 10, level: 'secondary1', schoolType: 'hauptschule' },
    { value: '6_haupt', label: '6. Klasse (Hauptschule)', age: 11, level: 'secondary1', schoolType: 'hauptschule' },
    { value: '7_haupt', label: '7. Klasse (Hauptschule)', age: 12, level: 'secondary1', schoolType: 'hauptschule' },
    { value: '8_haupt', label: '8. Klasse (Hauptschule)', age: 13, level: 'secondary1', schoolType: 'hauptschule' },
    { value: '9_haupt', label: '9. Klasse (Hauptschule)', age: 14, level: 'secondary1', schoolType: 'hauptschule' },
    { value: '10_haupt', label: '10. Klasse (Hauptschule)', age: 15, level: 'secondary1', schoolType: 'hauptschule' },
    // Sekundarstufe I - Realschule
    { value: '5_real', label: '5. Klasse (Realschule)', age: 10, level: 'secondary1', schoolType: 'realschule' },
    { value: '6_real', label: '6. Klasse (Realschule)', age: 11, level: 'secondary1', schoolType: 'realschule' },
    { value: '7_real', label: '7. Klasse (Realschule)', age: 12, level: 'secondary1', schoolType: 'realschule' },
    { value: '8_real', label: '8. Klasse (Realschule)', age: 13, level: 'secondary1', schoolType: 'realschule' },
    { value: '9_real', label: '9. Klasse (Realschule)', age: 14, level: 'secondary1', schoolType: 'realschule' },
    { value: '10_real', label: '10. Klasse (Realschule)', age: 15, level: 'secondary1', schoolType: 'realschule' },
    // Sekundarstufe I - Gymnasium
    { value: '5_gym', label: '5. Klasse (Gymnasium)', age: 10, level: 'secondary1', schoolType: 'gymnasium' },
    { value: '6_gym', label: '6. Klasse (Gymnasium)', age: 11, level: 'secondary1', schoolType: 'gymnasium' },
    { value: '7_gym', label: '7. Klasse (Gymnasium)', age: 12, level: 'secondary1', schoolType: 'gymnasium' },
    { value: '8_gym', label: '8. Klasse (Gymnasium)', age: 13, level: 'secondary1', schoolType: 'gymnasium' },
    { value: '9_gym', label: '9. Klasse (Gymnasium)', age: 14, level: 'secondary1', schoolType: 'gymnasium' },
    { value: '10_gym', label: '10. Klasse (Gymnasium)', age: 15, level: 'secondary1', schoolType: 'gymnasium' },
    // Sekundarstufe II - Gymnasium Oberstufe
    { value: '11_gym', label: '11. Klasse (Gymnasium Oberstufe)', age: 16, level: 'secondary2', schoolType: 'gymnasium' },
    { value: '12_gym', label: '12. Klasse (Gymnasium Oberstufe)', age: 17, level: 'secondary2', schoolType: 'gymnasium' },
    { value: '13_gym', label: '13. Klasse (Gymnasium Oberstufe)', age: 18, level: 'secondary2', schoolType: 'gymnasium' },
    // Gesamtschule (kombiniert alle)
    { value: '5_gesamt', label: '5. Klasse (Gesamtschule)', age: 10, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '6_gesamt', label: '6. Klasse (Gesamtschule)', age: 11, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '7_gesamt', label: '7. Klasse (Gesamtschule)', age: 12, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '8_gesamt', label: '8. Klasse (Gesamtschule)', age: 13, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '9_gesamt', label: '9. Klasse (Gesamtschule)', age: 14, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '10_gesamt', label: '10. Klasse (Gesamtschule)', age: 15, level: 'secondary1', schoolType: 'gesamtschule' },
    { value: '11_gesamt', label: '11. Klasse (Gesamtschule)', age: 16, level: 'secondary2', schoolType: 'gesamtschule' },
    { value: '12_gesamt', label: '12. Klasse (Gesamtschule)', age: 17, level: 'secondary2', schoolType: 'gesamtschule' },
    { value: '13_gesamt', label: '13. Klasse (Gesamtschule)', age: 18, level: 'secondary2', schoolType: 'gesamtschule' },
  ],
  AT: [
    // Vorschule und Betreuung
    { value: 'spielgruppe', label: 'Spielgruppe', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'kita', label: 'Kita / Kindertagesstätte', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'kindergarten', label: 'Kindergarten', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'hort', label: 'Hort (Nachmittagsbetreuung)', age: 6, level: 'care', careType: 'hort' },
    // Volksschule
    { value: '1', label: '1. Klasse (Volksschule)', age: 6, level: 'primary' },
    { value: '2', label: '2. Klasse (Volksschule)', age: 7, level: 'primary' },
    { value: '3', label: '3. Klasse (Volksschule)', age: 8, level: 'primary' },
    { value: '4', label: '4. Klasse (Volksschule)', age: 9, level: 'primary' },
    // Sekundarstufe I
    { value: '5', label: '5. Klasse (Mittelschule/AHS Unterstufe)', age: 10, level: 'secondary1' },
    { value: '6', label: '6. Klasse (Mittelschule/AHS Unterstufe)', age: 11, level: 'secondary1' },
    { value: '7', label: '7. Klasse (Mittelschule/AHS Unterstufe)', age: 12, level: 'secondary1' },
    { value: '8', label: '8. Klasse (Mittelschule/AHS Unterstufe)', age: 13, level: 'secondary1' },
    // Sekundarstufe II (AHS Oberstufe, BHS, etc.)
    { value: '9', label: '9. Klasse (AHS Oberstufe, BHS, etc.)', age: 14, level: 'secondary2' },
    { value: '10', label: '10. Klasse (AHS Oberstufe, BHS, etc.)', age: 15, level: 'secondary2' },
    { value: '11', label: '11. Klasse (AHS Oberstufe, BHS, etc.)', age: 16, level: 'secondary2' },
    { value: '12', label: '12. Klasse (AHS Oberstufe, BHS, etc.)', age: 17, level: 'secondary2' },
    { value: '13', label: '13. Klasse (AHS Oberstufe, BHS, etc.)', age: 18, level: 'secondary2' },
  ],
  GB: [
    // Preschool and Care
    { value: 'playgroup', label: 'Playgroup', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'nursery', label: 'Nursery', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'reception', label: 'Reception', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'afterschool', label: 'After School Club', age: 5, level: 'care', careType: 'hort' },
    // Primary
    { value: 'year1', label: 'Year 1', age: 5, level: 'primary' },
    { value: 'year2', label: 'Year 2', age: 6, level: 'primary' },
    { value: 'year3', label: 'Year 3', age: 7, level: 'primary' },
    { value: 'year4', label: 'Year 4', age: 8, level: 'primary' },
    { value: 'year5', label: 'Year 5', age: 9, level: 'primary' },
    { value: 'year6', label: 'Year 6', age: 10, level: 'primary' },
    // Secondary
    { value: 'year7', label: 'Year 7', age: 11, level: 'secondary1' },
    { value: 'year8', label: 'Year 8', age: 12, level: 'secondary1' },
    { value: 'year9', label: 'Year 9', age: 13, level: 'secondary1' },
    { value: 'year10', label: 'Year 10', age: 14, level: 'secondary1' },
    { value: 'year11', label: 'Year 11', age: 15, level: 'secondary1' },
    // Sixth Form/College (A-Levels, etc.)
    { value: 'year12', label: 'Year 12 (A-Levels, etc.)', age: 16, level: 'secondary2' },
    { value: 'year13', label: 'Year 13 (A-Levels, etc.)', age: 17, level: 'secondary2' },
  ],
  NL: [
    // Voorschool en opvang
    { value: 'peuterspeelzaal', label: 'Peuterspeelzaal', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'kinderdagverblijf', label: 'Kinderdagverblijf', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'kleuterschool', label: 'Kleuterschool', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'bso', label: 'Buitenschoolse opvang (BSO)', age: 4, level: 'care', careType: 'hort' },
    // Primarstufe (Basisonderwijs)
    { value: 'groep1', label: 'Groep 1', age: 4, level: 'primary' },
    { value: 'groep2', label: 'Groep 2', age: 5, level: 'primary' },
    { value: 'groep3', label: 'Groep 3', age: 6, level: 'primary' },
    { value: 'groep4', label: 'Groep 4', age: 7, level: 'primary' },
    { value: 'groep5', label: 'Groep 5', age: 8, level: 'primary' },
    { value: 'groep6', label: 'Groep 6', age: 9, level: 'primary' },
    { value: 'groep7', label: 'Groep 7', age: 10, level: 'primary' },
    { value: 'groep8', label: 'Groep 8', age: 11, level: 'primary' },
    // Sekundarstufe (Voortgezet onderwijs)
    { value: 'klas1', label: 'Klas 1', age: 12, level: 'secondary1' },
    { value: 'klas2', label: 'Klas 2', age: 13, level: 'secondary1' },
    { value: 'klas3', label: 'Klas 3', age: 14, level: 'secondary1' },
    { value: 'klas4', label: 'Klas 4', age: 15, level: 'secondary1' },
    { value: 'klas5', label: 'Klas 5 (VWO, HAVO, etc.)', age: 16, level: 'secondary2' },
    { value: 'klas6', label: 'Klas 6 (VWO, HAVO, etc.)', age: 17, level: 'secondary2' },
  ],
  FR: [
    // Garde d'enfants et maternelle
    { value: 'garde', label: 'Garde d\'enfants', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'creche', label: 'Crèche', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'maternelle', label: 'École maternelle', age: 3, level: 'preschool', careType: 'kindergarten' },
    { value: 'garderie', label: 'Garderie (après l\'école)', age: 6, level: 'care', careType: 'hort' },
    // Primarstufe (École primaire)
    { value: 'cp', label: 'CP (Cours Préparatoire)', age: 6, level: 'primary' },
    { value: 'ce1', label: 'CE1 (Cours Élémentaire 1)', age: 7, level: 'primary' },
    { value: 'ce2', label: 'CE2 (Cours Élémentaire 2)', age: 8, level: 'primary' },
    { value: 'cm1', label: 'CM1 (Cours Moyen 1)', age: 9, level: 'primary' },
    { value: 'cm2', label: 'CM2 (Cours Moyen 2)', age: 10, level: 'primary' },
    // Collège
    { value: '6eme', label: '6ème', age: 11, level: 'secondary1' },
    { value: '5eme', label: '5ème', age: 12, level: 'secondary1' },
    { value: '4eme', label: '4ème', age: 13, level: 'secondary1' },
    { value: '3eme', label: '3ème', age: 14, level: 'secondary1' },
    // Lycée (Baccalauréat, etc.)
    { value: '2nde', label: '2nde (Lycée)', age: 15, level: 'secondary2' },
    { value: '1ere', label: '1ère (Lycée)', age: 16, level: 'secondary2' },
    { value: 'terminale', label: 'Terminale (Baccalauréat, etc.)', age: 17, level: 'secondary2' },
  ],
  US: [
    // Preschool and Care
    { value: 'daycare', label: 'Daycare', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'preschool', label: 'Preschool', age: 3, level: 'preschool', careType: 'kita' },
    { value: 'kindergarten_us', label: 'Kindergarten', age: 5, level: 'preschool', careType: 'kindergarten' },
    { value: 'afterschool_us', label: 'After School Program', age: 6, level: 'care', careType: 'hort' },
    // Elementary School
    { value: '1st', label: '1st Grade', age: 6, level: 'primary' },
    { value: '2nd', label: '2nd Grade', age: 7, level: 'primary' },
    { value: '3rd', label: '3rd Grade', age: 8, level: 'primary' },
    { value: '4th', label: '4th Grade', age: 9, level: 'primary' },
    { value: '5th', label: '5th Grade', age: 10, level: 'primary' },
    // Middle School
    { value: '6th', label: '6th Grade', age: 11, level: 'secondary1' },
    { value: '7th', label: '7th Grade', age: 12, level: 'secondary1' },
    { value: '8th', label: '8th Grade', age: 13, level: 'secondary1' },
    // High School
    { value: '9th', label: '9th Grade (Freshman)', age: 14, level: 'secondary2' },
    { value: '10th', label: '10th Grade (Sophomore)', age: 15, level: 'secondary2' },
    { value: '11th', label: '11th Grade (Junior)', age: 16, level: 'secondary2' },
    { value: '12th', label: '12th Grade (Senior)', age: 17, level: 'secondary2' },
  ],
  IT: [
    // Asilo e assistenza
    { value: 'asilo_nido', label: 'Asilo nido', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'nido', label: 'Nido', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'materna', label: 'Scuola materna', age: 3, level: 'preschool', careType: 'kindergarten' },
    { value: 'doposcuola', label: 'Doposcuola', age: 6, level: 'care', careType: 'hort' },
    // Scuola primaria (Grundschule)
    { value: '1', label: '1a elementare', age: 6, level: 'primary' },
    { value: '2', label: '2a elementare', age: 7, level: 'primary' },
    { value: '3', label: '3a elementare', age: 8, level: 'primary' },
    { value: '4', label: '4a elementare', age: 9, level: 'primary' },
    { value: '5', label: '5a elementare', age: 10, level: 'primary' },
    // Scuola secondaria di primo grado (Mittelschule)
    { value: '6', label: '1a media', age: 11, level: 'secondary1' },
    { value: '7', label: '2a media', age: 12, level: 'secondary1' },
    { value: '8', label: '3a media', age: 13, level: 'secondary1' },
    // Scuola secondaria di secondo grado (Liceo, Istituto tecnico, etc.)
    { value: '9', label: '1a superiore (Liceo, Istituto tecnico, etc.)', age: 14, level: 'secondary2' },
    { value: '10', label: '2a superiore (Liceo, Istituto tecnico, etc.)', age: 15, level: 'secondary2' },
    { value: '11', label: '3a superiore (Liceo, Istituto tecnico, etc.)', age: 16, level: 'secondary2' },
    { value: '12', label: '4a superiore (Liceo, Istituto tecnico, etc.)', age: 17, level: 'secondary2' },
    { value: '13', label: '5a superiore (Liceo, Istituto tecnico, etc.)', age: 18, level: 'secondary2' },
  ],
  ES: [
    // Guardería y educación infantil
    { value: 'guarderia', label: 'Guardería', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'escuela_infantil', label: 'Escuela infantil', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'educacion_infantil', label: 'Educación Infantil', age: 3, level: 'preschool', careType: 'kindergarten' },
    { value: 'extraescolares', label: 'Actividades extraescolares', age: 6, level: 'care', careType: 'hort' },
    // Educación Primaria (Grundschule)
    { value: '1', label: '1º Primaria', age: 6, level: 'primary' },
    { value: '2', label: '2º Primaria', age: 7, level: 'primary' },
    { value: '3', label: '3º Primaria', age: 8, level: 'primary' },
    { value: '4', label: '4º Primaria', age: 9, level: 'primary' },
    { value: '5', label: '5º Primaria', age: 10, level: 'primary' },
    { value: '6', label: '6º Primaria', age: 11, level: 'primary' },
    // Educación Secundaria Obligatoria (ESO)
    { value: '7', label: '1º ESO', age: 12, level: 'secondary1' },
    { value: '8', label: '2º ESO', age: 13, level: 'secondary1' },
    { value: '9', label: '3º ESO', age: 14, level: 'secondary1' },
    { value: '10', label: '4º ESO', age: 15, level: 'secondary1' },
    // Bachillerato (Gymnasium, etc.)
    { value: '11', label: '1º Bachillerato', age: 16, level: 'secondary2' },
    { value: '12', label: '2º Bachillerato', age: 17, level: 'secondary2' },
  ],
  BE: [
    // Voorschool en opvang
    { value: 'peuteropvang', label: 'Peuteropvang', age: 1, level: 'preschool', careType: 'spielgruppe' },
    { value: 'kinderdagverblijf_be', label: 'Kinderdagverblijf', age: 2, level: 'preschool', careType: 'kita' },
    { value: 'kleuterschool_be', label: 'Kleuterschool', age: 4, level: 'preschool', careType: 'kindergarten' },
    { value: 'bso_be', label: 'Buitenschoolse opvang', age: 6, level: 'care', careType: 'hort' },
    // Basisonderwijs (Primarstufe)
    { value: '1', label: '1e leerjaar', age: 6, level: 'primary' },
    { value: '2', label: '2e leerjaar', age: 7, level: 'primary' },
    { value: '3', label: '3e leerjaar', age: 8, level: 'primary' },
    { value: '4', label: '4e leerjaar', age: 9, level: 'primary' },
    { value: '5', label: '5e leerjaar', age: 10, level: 'primary' },
    { value: '6', label: '6e leerjaar', age: 11, level: 'primary' },
    // Secundair onderwijs (Sekundarstufe)
    { value: '7', label: '1e middelbaar (ASO, TSO, BSO, etc.)', age: 12, level: 'secondary1' },
    { value: '8', label: '2e middelbaar (ASO, TSO, BSO, etc.)', age: 13, level: 'secondary1' },
    { value: '9', label: '3e middelbaar (ASO, TSO, BSO, etc.)', age: 14, level: 'secondary1' },
    { value: '10', label: '4e middelbaar (ASO, TSO, BSO, etc.)', age: 15, level: 'secondary1' },
    { value: '11', label: '5e middelbaar (ASO, TSO, BSO, etc.)', age: 16, level: 'secondary2' },
    { value: '12', label: '6e middelbaar (ASO, TSO, BSO, etc.)', age: 17, level: 'secondary2' },
  ],
};

export function getSchoolGrades(countryCode: string): SchoolGrade[] {
  return countrySchoolGrades[countryCode] || countrySchoolGrades['CH']; // Fallback zu CH
}

