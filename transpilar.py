
contents = {
  'js': '',
  'css': '',
  'html': ''
}

with open('./dist/assets/index-2b92ba5d.js', 'r') as file:
  contents['js'] = file.read()

with open('./dist/assets/index-3d00a0a6.css', 'r') as file:
  contents['css'] = file.read()

with open('./dist/index.html', 'r') as file:
  for line in file:
    if('<script>' in line):
      print(line.strip())
  # contents['html'] = file.read()
