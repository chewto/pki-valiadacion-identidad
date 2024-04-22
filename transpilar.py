contents = {
  'js': '',
  'css': '',
}

html = []

with open('./dist/assets/index-50b8a8d7.js', 'r') as file:
    contents['js'] = file.read()

with open('./dist/assets/index-756bcaa3.css', 'r') as file:
    contents['css'] = file.read()

with open('./dist/index.html', 'r') as file:
    for line in file:
        html.append(line)

def buscarEliminar(string):
  contador = 0
  for line in html:
    contador += 1
    if(string in line):
      html.pop(contador - 1)

buscarEliminar('<script type="module" crossorigin src="/assets/index-50b8a8d7.js"></script>')
buscarEliminar('<link rel="stylesheet" href="/assets/index-756bcaa3.css">')



print(html)