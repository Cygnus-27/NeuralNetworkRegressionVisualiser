import zipfile
import xml.etree.ElementTree as ET

for f in ['Project Development Guidelines.docx', 'kmeans_ref.docx']:
    try:
        t = ''.join(n.text or '' for n in ET.XML(zipfile.ZipFile(f).read('word/document.xml')).iter() if n.tag.endswith('}t'))
        print(f'=== {f} ===\n{t}\n')
    except Exception as e: print(e)
try:
    print('=== kmeansref.xlsx ===')
    print('\n'.join(n.text or '' for n in ET.XML(zipfile.ZipFile('kmeansref.xlsx').read('xl/sharedStrings.xml')).iter() if n.tag.endswith('}t')))
except Exception as e: print(e)
