## Aozora Project
Scraping Aozora books (https://www.aozora.gr.jp/) and fix them to usable text and audio files.

### Projects
1. aozoraScraper  
- scrape.ts: (npm start)  
Get all books raw data from [https://www.aozora.gr.jp/](https://www.aozora.gr.jp/).  
Files are downloaded as zip file.  

- scrapetitle.ts: (npm run title)  
Get all books title data from [https://www.aozora.gr.jp/](https://www.aozora.gr.jp/).  
book titles are written out to output dir as csv file.   

2. aozoraExtractor  
After unzipping, extract text files to one directory.

3. aozoraModifier  
Remove unnecessary strings, and make them recordable form.

4. aozoraRenamer  
Rename filenames to 'title-author-editor-index.txt'.

5. aozoraRecorder  
Make them convert to .wav data at all once with [Style-Bert-VITS2](https://github.com/litagin02/Style-Bert-VITS2).
