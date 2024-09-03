import mariadb
import base64
import socket
import requests

credencialesDB = {
  "desarrollo":{
    "password":'30265611',
    "nombre":'pki_validacion',
    "host":'localhost',
    "port":3306,
    "user":'root'
  },
  "libertador":{
    "password":'30265611',
    "nombre":'pki_validacion',
    "host":'93.93.119.219',
    "port":3306,
    "user":'administrador'
  },
  "eFirmaPanama":{
    "password":'10830921',
    "nombre":'pki_validacion',
    "host":'74.208.221.227',
    "port":3306,
    "user":'root'
  },
  "eFirmaCO":{
    "password":'30265611',
    "nombre":'pki_validacion',
    "host":'216.225.195.14',
    "port":3306,
    "user":'administrador'
  }
}

credencialesDBEntidad = {
  "desarrollo":{
    "password":'30265611',
    "nombre":'pki_firma_electronica',
    "host":'localhost',
    "port":3306,
    "user":'root'
  },
  "libertador":{
    "password":'30265611',
    "nombre":'pki_firma_electronica',
    "host":'93.93.119.219',
    "port":3306,
    "user":'administrador'
  },
  "eFirmaPanama":{
    "password":'10830921',
    "nombre":'pki_firma_electronica',
    "host":'74.208.221.227',
    "port":3306,
    "user":'root'
  },
  "eFirmaCO":{
    "password":'30265611',
    "nombre":'pki_firma_electronica',
    "host":'216.225.195.14',
    "port":3306,
    "user":'administrador'
  }
}

credenciales = 'eFirmaPanama'


passwordDB = credencialesDB[credenciales]["password"]
nombreDB = credencialesDB[credenciales]["nombre"]
hostDB = credencialesDB[credenciales]["host"]
portDB = credencialesDB[credenciales]["port"]
userDB = credencialesDB[credenciales]["user"]

passwordDBEntidad = credencialesDBEntidad[credenciales]["password"]
nombreDBEntidad = credencialesDBEntidad[credenciales]["nombre"]
hostDBEntidad = credencialesDBEntidad[credenciales]["host"]
portDBEntidad = credencialesDBEntidad[credenciales]["port"]
userDBEntidad = credencialesDBEntidad[credenciales]["user"]

def obtenerIpPrivada():
  hostname = socket.gethostname()
  direccionIp = socket.gethostbyname(hostname)
  return direccionIp

def obtenerIpPublica():
  ip = requests.get('https://api.ipify.org').text

  return ip


def selectData(query, *values):
  try:
    conn = mariadb.connect(
      user=userDB,
      password=passwordDB,
      host=hostDB,
      port=portDB,
      database=nombreDB
    )
  except mariadb.Error as e:
    print(e)
    return ()
  
  try:
    cursor = conn.cursor()

    cursor.execute(query, values)

    data = cursor.fetchone()

    return data

  except mariadb.Error as e:
    print(e)
    return ()

  finally:
    conn.commit()
    cursor.close()
    conn.close()


def getUser(tabla,id):
  
  conn = mariadb.connect(
    user=userDB,
    password=passwordDB,
    host=hostDB,
    port=portDB,
    database=nombreDB
  )

  cursor = conn.cursor()

  cursor.execute(f'SELECT * FROM {tabla} WHERE id = {id}')

  usuario = cursor.fetchone()

  usuarioDiccionario = {
    'nombre': usuario[1],
    'apellido': usuario[2],
    'correo': usuario[5],
    'documento': usuario[3]
  }

  cursor.close()
  conn.close()

  return usuarioDiccionario

def insertTabla(columns: tuple, table:str, values: tuple):

  try:
    conn = mariadb.connect(
      user=userDB,
      password=passwordDB,
      host=hostDB,
      port=portDB,
      database=nombreDB
    )
  except mariadb.Error as e:
    print(f"error en la query, error = {e}")
    return 0

  try:
    cursor = conn.cursor()

    columnasStr:str = ','.join(columns)
    placeHolder:list = []

    for columna in columns:
      placeHolder.append('?')

    placeHolderStr:str = ','.join(placeHolder)


    query = f"INSERT INTO {table} ({columnasStr}) VALUES ({placeHolderStr})"
    cursor.execute(query,values)

    documentoUsuarioID = cursor.lastrowid

    return documentoUsuarioID

  except mariadb.Error as e:

    print("error =", e)
    return 0

  finally:
    conn.commit()
    cursor.close()
    conn.close()

def comprobarProceso(id):

  try:
    conn = mariadb.connect(
      user=userDB,
      password=passwordDB,
      host=hostDB,
      port=portDB,
      database=nombreDB
    )
  except mariadb.Error as e:
    return f"error en la query, error = {e}"

  try:
    cursor = conn.cursor()

    queryInfo = f'SELECT count(ea.estado_verificacion), ea.estado_verificacion FROM documento_usuario as du INNER JOIN evidencias_adicionales ea ON ea.id=du.id_evidencias_adicionales WHERE (ea.estado_verificacion="verificado" OR ea.estado_verificacion="Iniciando segunda validación" OR ea.estado_verificacion="Procesando segunda validación" OR ea.estado_verificacion="se requiere nueva validación") and id_usuario_efirma = {id}'
    cursor.execute(queryInfo)

    comprobacion = cursor.fetchone()

    if(comprobacion):
      return {
        "validaciones": comprobacion[0],
        "estado": comprobacion[1]
      }
    else:
      return {
        "validaciones": 0,
        "estado": ''
      }

  except mariadb.Error as e:

    print("error =", e)

  finally:
    conn.commit()
    cursor.close()
    conn.close()

def obtenerEntidad(id):

  try:
    conn = mariadb.connect(
      user=userDBEntidad,
      password=passwordDBEntidad,
      host=hostDBEntidad,
      port=portDBEntidad,
      database=nombreDBEntidad
    )
  except mariadb.Error as e:
    print(e)
    return 0,0

  try:
    cursor = conn.cursor()

    queryInfo = f'SELECT fe.usuario_id,usu.entity_id from pki_firma_electronica.firma_electronica_pki as fe INNER JOIN pki_firma_electronica.firmador_pki fi ON fe.id=fi.firma_electronica_id INNER JOIN usuarios.usuarios usu ON usu.id=fe.usuario_id WHERE fi.id={id}'

    cursor.execute(queryInfo)

    entidad = cursor.fetchone()

    if(entidad):
      return entidad[0], entidad[1]
    else:
      return 0, 0


  except mariadb.Error as e:
    print(e)
    return 0,0

  finally:
    conn.commit()
    cursor.close()
    conn.close()

def selectProvider(id):
  
  try:
    conn = mariadb.connect(
      user=userDBEntidad,
      password=passwordDBEntidad,
      host=hostDBEntidad,
      port=portDBEntidad,
      database=nombreDBEntidad
    )
  except mariadb.Error as e:
    print(e)
    return 'EFIRMA'

  try:
    cursor = conn.cursor()

    queryInfo = "SELECT ent.nombre_entidad, ent.validacion FROM pki_firma_electronica.firmador_pki fir INNER JOIN pki_firma_electronica.firma_electronica_pki AS fe ON fe.id = fir.firma_electronica_id INNER JOIN usuarios.usuarios AS usu ON usu.id = fe.usuario_id INNER JOIN usuarios.entidades AS ent ON ent.entity_id = usu.entity_id WHERE fir.id = ?"

    cursor.execute(queryInfo, (id,))

    entidad = cursor.fetchone()

    if(entidad != None):

      if(entidad[1] == None):
        return 'EFIRMA'
      
      return entidad[1]

    else:
      return 'EFIRMA'


  except mariadb.Error as e:
    print(e)
    return 'EFIRMA'

  finally:
    conn.commit()
    cursor.close()
    conn.close()