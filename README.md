## Aozora Project
Scraping Aozora books (https://www.aozora.gr.jp/) and fix them to usable text and audio files.

### Projects
1. aozoraScraper  
Get all books raw data from "青空文庫([(https://www.aozora.gr.jp/)](https://www.aozora.gr.jp/))".  
Downloaded files are written out to zip  

2. aozoraExtractor
After unzipping, extract text files to one directory.

3. aozoraModifier
Remove unnecessary strings, and make them recordable form.

4. aozoraRenamer
Rename filenames to 'title-author-editor-index.txt'.

5. aozoraRecorder
Make them convert to .wav data at all once with Style-Bert-VITS2(https://github.com/litagin02/Style-Bert-VITS2(.
