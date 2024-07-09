// Constants for reusable values
const URL_SEGMENT_BEFORE_LANGUAGE_SEGMENTS = 'vocabulary';
const SOURCE_LANGUAGE_ELEMENT_CLASS_NAME = 'span.wA';
const TARGET_LANGUAGE_ELEMENT_CLASS_NAME = 'span.speak.xs.voice';
const WORD_TYPE_ELEMENT_CLASS_NAME = 'small.cCCC.wP';

// Function to extract languages from URL
function getLanguagesFromURL() {
    const urlSegments = window.location.pathname.split('/');
    const vocabularyIndex = urlSegments.indexOf(URL_SEGMENT_BEFORE_LANGUAGE_SEGMENTS);
    if (vocabularyIndex === -1) return [null, null];
    const sourceLang = urlSegments[vocabularyIndex + 1];
    const targetLang = urlSegments[vocabularyIndex + 2];
    return [sourceLang, targetLang];
}

// Function to extract details from a vocabulary item
function extractVocabularyDetails(item, currentSection) {
    const sourceLanguageElement = item.querySelector(SOURCE_LANGUAGE_ELEMENT_CLASS_NAME);
    const targetLanguageElement = item.querySelector(TARGET_LANGUAGE_ELEMENT_CLASS_NAME);
    if (sourceLanguageElement && targetLanguageElement) {
        const title = sourceLanguageElement.getAttribute('title');
        // remove the square brackets from the string. Seperate source language words with pipes instead of commas
        const sourceLanguageWords = title.replace(/\[.*?\]/, '').trim().replace(/, /g, '|');
        const targetLanguageWord = targetLanguageElement.innerText.trim();
        const wordTypeElement = item.querySelector(WORD_TYPE_ELEMENT_CLASS_NAME);
        const type = wordTypeElement ? wordTypeElement.innerText.replace('· ', '').trim() : '';
        // return [currentSection, targetLanguageWord, sourceLanguageWords, type];
        return {
            section: currentSection,
            targetLangWord: targetLanguageWord,
            sourceLangWords: sourceLanguageWords,
            type: type
        };
    }
    return null;
}

// Function to extract words, translations, sections, and types
function createVocabularyDataSet() {
    const vocabularyItems = [];
    let currentSection = "";
    document.querySelectorAll('#words > ul > li').forEach(item => {
        if (item.classList.contains('single')) {
            const sectionHeader = item.querySelector('h3');
            if (sectionHeader) {
                currentSection = sectionHeader.innerText.trim();
            }
        } else {
            const vocabularyItem = extractVocabularyDetails(item, currentSection);
            if (vocabularyItem) {
                vocabularyItems.push(vocabularyItem);
            }
        }
    });
    return vocabularyItems;
}

function createSectionVocabularySet() {
    const sections = {};
    let currentSection = "";
    document.querySelectorAll('#words > ul > li').forEach(item => {
        if (item.classList.contains('single')) {
            const sectionHeader = item.querySelector('h3');
            if (sectionHeader) {
                currentSection = sectionHeader.innerText.trim();
                sections[currentSection] = { words: [], headerElement: sectionHeader };
            }
        } else {
            const vocabularyItem = extractVocabularyDetails(item, currentSection);
            if (vocabularyItem) {
                sections[currentSection].words.push(vocabularyItem);
            }
        }
    });

    return sections;
}

// Function to convert array of words to CSV format
function convertToCSV(vocabularyItemSet, includeSection, includeType, includeID, languages) {
    const [sourceLang, targetLang] = languages;
    let headers = `${ includeID ? 'ID,' : ''}${ includeSection ? 'Section,' : ''}${targetLang},${sourceLang}${ includeType ? ',Type' : ''}`
    let csvContent = `\uFEFF${headers}\n`;

    vocabularyItemSet.forEach((vocabularyItem, index) => {
        const rowElements = [];

        if (includeID) {
            rowElements.push(index + 1);
        }
        if (includeSection) {
            rowElements.push(vocabularyItem.section);
        }

        rowElements.push(vocabularyItem.targetLangWord);
        rowElements.push(vocabularyItem.sourceLangWords);

        if (includeType) {
            rowElements.push(vocabularyItem.type);
        }

        const row = rowElements.join(',') + '\n';
        csvContent += row;
    });

    return csvContent;
}

function addStyles() {
    const style = document.createElement('style');
    const css = `
        .download-link {
            background-color: #20a8e9;
            color: white !important;
            padding: 5px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 3px;
            box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
            margin-left: 38px;
            font-size: 12px;
            cursor: pointer;
        }
        
        .section-checkbox, .checkbox-label {
            margin-bottom: 20px;
            margin-left: 10px;
        }
    `;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

function createFileName(sectionName, includeSection, includeType, includeID) {
    const [sourceLang, targetLang] = getLanguagesFromURL();
    return `vocabulary_${sourceLang}_${targetLang}_${includeSection ? sectionName : 'noSection'}_${includeType ? 'withType' : 'noType'}_${includeID ? 'withID' : 'noID'}.csv`;
}

function createDownloadButton(descriptionOfDownloadContent) {
    const link = document.createElement("a");
    link.innerText = `Download ${descriptionOfDownloadContent}`;
    link.classList.add("download-link");
    return link;
}

// Function to create a download link for the CSV file using Blob
function createDownloadLink(csvContent, descriptionOfDownloadContent, includeSection, includeType, includeID) {
    const link = document.createElement("a");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = createFileName(descriptionOfDownloadContent, includeSection, includeType, includeID)
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    link.innerText = `Download ${descriptionOfDownloadContent}`;
    link.classList.add("download-link");
    return link;
}

// Function to create a checkbox for the section
function createCheckbox(labelText) {
    const checkboxLabel = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("section-checkbox");
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(document.createTextNode(` Include ${labelText}`));
    checkboxLabel.classList.add("checkbox-label");
    return checkboxLabel;
}

function triggerDownload(selectedCsvContent, fileName) {
    const blob = new Blob([selectedCsvContent], { type: 'text/csv;charset=utf-8;' });
    const tempLink = document.createElement('a');
    tempLink.href = URL.createObjectURL(blob);
    tempLink.setAttribute('download', fileName);
    tempLink.click();
}

// Function to append the download link and checkboxes next to the section header
function appendLinkAndCheckboxesToSection(link, sectionCheckbox, typeCheckbox, sectionElement) {
    sectionElement.parentElement.appendChild(link);
    sectionElement.parentElement.appendChild(sectionCheckbox);
    sectionElement.parentElement.appendChild(typeCheckbox);
}

function createSectionUI(languages) {
    const sections = createSectionVocabularySet();

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
        const sectionLink = createDownloadButton(sectionName);
        const sectionCheckboxLabel = createCheckbox(`section name (${sectionName})`);
        const typeCheckboxLabel = createCheckbox("type of word");
        appendLinkAndCheckboxesToSection(sectionLink, sectionCheckboxLabel, typeCheckboxLabel, sectionData.headerElement);

        sectionLink.addEventListener('click', (event) => {
            event.preventDefault();
            const includeSection = sectionCheckboxLabel.querySelector('input').checked;
            const includeType = typeCheckboxLabel.querySelector('input').checked;

            const fileName = createFileName(sectionName, includeSection, includeType, false);
            const sectionCsvContent = convertToCSV(sectionData.words, includeSection, includeType, false, languages);
            triggerDownload(sectionCsvContent, fileName);
        });
    });
}

function createMainDownloadUI(languages) {
    const fullLink = createDownloadButton("Download All")
    const fullSectionCheckboxLabel = createCheckbox("sections names");
    const fullTypeCheckboxLabel = createCheckbox("type of word");
    const fullIDCheckboxLabel = createCheckbox("ID");
    document.querySelector('h4').appendChild(fullLink);
    document.querySelector('h4').appendChild(fullSectionCheckboxLabel);
    document.querySelector('h4').appendChild(fullTypeCheckboxLabel);
    document.querySelector('h4').appendChild(fullIDCheckboxLabel);

    fullLink.addEventListener('click', (event) => {
        event.preventDefault();
        const vocabularyItems = createVocabularyDataSet();
        const includeAllSections = fullSectionCheckboxLabel.querySelector('input').checked;
        const includeType = fullTypeCheckboxLabel.querySelector('input').checked;
        const includeID = fullIDCheckboxLabel.querySelector('input').checked;

        const fileName = createFileName('all', includeAllSections, includeType, includeID);
        const selectedCsvContent = convertToCSV(vocabularyItems, includeAllSections, includeType, includeID, languages);
        triggerDownload(selectedCsvContent, fileName);
    });
}

// Main function to extract, convert, and display CSV
function main() {
    const languages = getLanguagesFromURL();
    addStyles();
    createSectionUI(languages);
    createMainDownloadUI(languages);
}

// Run the main function
main();
