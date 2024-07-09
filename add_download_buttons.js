// Function to extract languages from URL
function getLanguagesFromURL() {
    const urlSegments = window.location.pathname.split('/');
    const sourceLang = urlSegments[urlSegments.indexOf('vocabulary') + 1];
    const targetLang = urlSegments[urlSegments.indexOf('vocabulary') + 2];
    return [sourceLang, targetLang];
}

// Function to process a vocabulary item
function processVocabularyItem(item, currentSection) {
    let spanItem = item.querySelector('span.wA');
    let speakItem = item.querySelector('span.speak.xs.voice');
    if (spanItem && speakItem) {
        let title = spanItem.getAttribute('title');
        let german = title.replace(/\[.*?\]/, '').trim().replace(/, /g, '|');
        let spanish = speakItem.innerText.trim();
        let typeElement = item.querySelector('small.cCCC.wP');
        let type = typeElement ? typeElement.innerText.replace('· ', '').trim() : '';
        return [currentSection, spanish, german, type];
    }
    return null;
}

// Function to extract words, translations, sections, and types
function extractWords() {
    let words = [];
    let currentSection = "";
    document.querySelectorAll('#words > ul > li').forEach(item => {
        if (item.classList.contains('single')) {
            let sectionHeader = item.querySelector('h3');
            if (sectionHeader) {
                currentSection = sectionHeader.innerText.trim();
            }
        } else {
            let vocabItem = processVocabularyItem(item, currentSection);
            if (vocabItem) {
                words.push(vocabItem);
            }
        }
    });
    return words;
}

// Function to generate a random ID
function generateRandomID() {
    return Math.random().toString(36).substr(2, 9);
}

// Function to convert array of words to CSV format
function convertToCSV(words, includeSection, includeType, includeID, languages) {
    const [sourceLang, targetLang] = languages;
    let headers = includeID ? `ID,` : '';
    headers += includeSection ? `Section,${targetLang},${sourceLang}` : `${targetLang},${sourceLang}`;
    headers = includeType ? headers + ",Type" : headers;
    let csvContent = `\uFEFF${headers}\n`;
    words.forEach(wordArray => {
        let row = includeID ? `${generateRandomID()},` : '';
        row += includeSection ? wordArray.join(",") : wordArray.slice(1).join(",");
        row = includeType ? row : row.replace(/,([^,]*)$/, ''); // Remove type if not included
        csvContent += row + "\n";
    });
    return csvContent;
}

// Function to create a download link for the CSV file using Blob
function createDownloadLink(csvContent, sectionName = "", includeSection = false, includeType = false, includeID = false) {
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    const [sourceLang, targetLang] = getLanguagesFromURL();
    let fileName = sectionName ? 
        `vocabulary_${sourceLang}_${targetLang}_${sectionName}_${includeSection ? 'withSection' : 'noSection'}_${includeType ? 'withType' : 'noType'}_${includeID ? 'withID' : 'noID'}.csv` : 
        `vocabulary_${sourceLang}_${targetLang}_${includeSection ? 'withSection' : 'noSection'}_${includeType ? 'withType' : 'noType'}_${includeID ? 'withID' : 'noID'}.csv`;
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    link.innerText = sectionName ? `Download ${sectionName}` : "Download All";
    link.style.backgroundColor = "#20a8e9";
    link.style.color = "white";
    link.style.padding = "5px";
    link.style.fontWeight = "bold";
    link.style.textDecoration = "none";
    link.style.borderRadius = "3px";
    link.style.boxShadow = "1px 1px 3px rgba(0, 0, 0, 0.3)";
    link.style.marginLeft = "10px";
    link.style.fontSize = "12px";
    return link;
}

// Function to create a checkbox for the section
function createCheckbox(labelText) {
    let checkboxLabel = document.createElement("label");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false; // Default to unchecked
    checkbox.style.marginLeft = "5px";
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(document.createTextNode(` Include ${labelText}`));
    checkboxLabel.style.marginLeft = "10px";
    return checkboxLabel;
}

// Function to append the download link and checkboxes next to the section header
function appendLinkAndCheckboxesToSection(link, sectionCheckbox, typeCheckbox, sectionElement) {
    sectionElement.appendChild(link);
    sectionElement.appendChild(sectionCheckbox);
    sectionElement.appendChild(typeCheckbox);
}

// Main function to extract, convert, and display CSV
function main() {
    let languages = getLanguagesFromURL();
    let words = extractWords();
    let fullLink = createDownloadLink(convertToCSV(words, true, true, false, languages), "", true, true, false);
    let fullSectionCheckboxLabel = createCheckbox("all sections");
    let fullTypeCheckboxLabel = createCheckbox("type of word");
    let fullIDCheckboxLabel = createCheckbox("ID");
    document.querySelector('h4').appendChild(fullLink);
    document.querySelector('h4').appendChild(fullSectionCheckboxLabel);
    document.querySelector('h4').appendChild(fullTypeCheckboxLabel);
    document.querySelector('h4').appendChild(fullIDCheckboxLabel);

    // Create section-specific download links
    let sections = {};
    let allItems = document.querySelectorAll('#words > ul > li');
    let currentSection = "";
    allItems.forEach(item => {
        if (item.classList.contains('single')) {
            let sectionHeader = item.querySelector('h3');
            if (sectionHeader) {
                currentSection = sectionHeader.innerText.trim();
                sections[currentSection] = { words: [], headerElement: sectionHeader };
            }
        } else {
            let vocabItem = processVocabularyItem(item, currentSection);
            if (vocabItem) {
                sections[currentSection].words.push(vocabItem);
            }
        }
    });

    for (let sectionName in sections) {
        let sectionWords = sections[sectionName].words;
        let sectionLink = createDownloadLink(convertToCSV(sectionWords, false, true, false, languages), sectionName, false, true, false);
        let sectionCheckboxLabel = createCheckbox(sectionName);
        let typeCheckboxLabel = createCheckbox("type of word");
        appendLinkAndCheckboxesToSection(sectionLink, sectionCheckboxLabel, typeCheckboxLabel, sections[sectionName].headerElement);

        // Add event listener to each section download button
        sectionLink.addEventListener('click', function (event) {
            event.preventDefault();
            let includeSection = sectionCheckboxLabel.querySelector('input').checked;
            let includeType = typeCheckboxLabel.querySelector('input').checked;
            let sectionCsvContent = convertToCSV(sectionWords, includeSection, includeType, false, languages);
            let blob = new Blob([sectionCsvContent], { type: 'text/csv;charset=utf-8;' });
            let fileName = `vocabulary_${languages[0]}_${languages[1]}_${sectionName}_${includeSection ? 'withSection' : 'noSection'}_${includeType ? 'withType' : 'noType'}_noID.csv`;
            let tempLink = document.createElement('a');
            tempLink.href = URL.createObjectURL(blob);
            tempLink.setAttribute('download', fileName);
            tempLink.click();
        });
    }

    // Add event listener to the full download button to respect the all sections, type of word, and ID checkboxes
    fullLink.addEventListener('click', function (event) {
        event.preventDefault();
        let includeAllSections = fullSectionCheckboxLabel.querySelector('input').checked;
        let includeType = fullTypeCheckboxLabel.querySelector('input').checked;
        let includeID = fullIDCheckboxLabel.querySelector('input').checked;
        let selectedCsvContent = convertToCSV(words, includeAllSections, includeType, includeID, languages);
        let blob = new Blob([selectedCsvContent], { type: 'text/csv;charset=utf-8;' });
        let fileName = `vocabulary_${languages[0]}_${languages[1]}_${includeAllSections ? 'withSection' : 'noSection'}_${includeType ? 'withType' : 'noType'}_${includeID ? 'withID' : 'noID'}.csv`;
        let tempLink = document.createElement('a');
        tempLink.href = URL.createObjectURL(blob);
        tempLink.setAttribute('download', fileName);
        tempLink.click();
    });
}

// Run the main function
main();
