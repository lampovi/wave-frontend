import argparse, markdown, os, io

parser = argparse.ArgumentParser(description="")
parser.add_argument("path", nargs="?", default=".", help="Path to file or directory")
parser.add_argument("-r", "--recursively", action="store_true",  help="Convert articles recursively")
parser.add_argument("-t", "--template", default=io.StringIO("{body}"), type=argparse.FileType("r"), help="Use template to wrap solid html")
args = parser.parse_args()
template = args.template.read()

def convert(md_path):
  html_path = md_path[:md_path.rfind(".")] + ".html"
  with open(md_path, "r", encoding="utf-8") as md_file:
    md = md_file.read()
    
    # Getting title from first line with "#"
    title = "Lampovi.site article"
    for line in md.split("\n"):
      if line.startswith("# "):
        title = line[2:]
        break
    
    article = markdown.markdown(md)
  
  html = template.format(title=title, body=article)
  with open(html_path, "w", encoding="utf-8") as html_file:
    html_file.write(html)

def find(dir_path):
  for path, dirs, files in os.walk(dir_path):
    for file in files:
      file_name = file.lower()
      if file_name.endswith(".md") or file_name.endswith(".markdown"):
        file_path = os.path.join(path, file)
        convert(file_path)

if args.recursively:
  find(args.path)
else:
  convert(args.path)