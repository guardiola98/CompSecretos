//Per a traure el nombre primo aleatorio necessitem la llibreria BigInteger


//F(v) = (xn-1vn-1 + xn-2vn-2 + ... + x2v2 + x1v1 + S) modulo p
//n es el numero de necesarias para reconstruir el secreto
//m es el numero de partes que se van a generar

function encrypt(texto){

  var encrypted = CryptoJS.AES.encrypt(texto, document.getElementById("pass").value);
  return encrypted;

}

function decrypt(texto){
  var decrypted = CryptoJS.AES.decrypt(texto, document.getElementById("pass1").value).toString(CryptoJS.enc.Utf8);
  return decrypted;
}


function reconstruir(){

  try{
    var parts=[];
    var str;
    var texto;
    var solucion;
    var v=[];
    var fv=[];
    var p;
    var x;
    var lines = document.getElementById('partes').value.split("\n");
    for(var i = 0;i < lines.length;i++){
      parts[i]=lines[i];
    }

    solucion = recuperarSecreto1(parts);
    document.getElementById("reconstruido").value=solucion.reverse();
  }
  catch(error){
    document.getElementById("reconstruido").value="¡SE HA PRODUCIDO UN ERROR EN EL PROCESO!";
  }


}



function recuperarSecreto1(parts){

  //primero recuperamos los polinomios
  //Vamos a utilizar la libreria BigInteger hasta el final ya que necesitamos el modulo inverso
  desencriptadas=[];
  for(i=0; i<parts.length;i++){
    desencriptadas[i]=decrypt(hex2str(parts[i]));
  }
  var padding=bigInt(desencriptadas[0].charAt(0), 10);
  var primo=bigInt(desencriptadas[0].split("-")[0].split(":")[1], 16);
  //AHORA SACAMOS EL VECTOR DE Vs
  var v=[];
  var longitud=desencriptadas[1].split("-").length ;
  for(i=0;i<parts.length;i++){
    v[i]=desencriptadas[i].split("-")[0].split(":")[2];
  }

  var partesPol=[];
  var vecSolucion=[];
  var solucion="";
  for(var i=0;i<longitud;i++){
    var partesPol=[];

    for(var j=0;j<parts.length;j++){
      if(i==0){
        partesPol[j]=desencriptadas[j].split("-")[i].split(":")[3];
      }else{
        partesPol[j]=desencriptadas[j].split("-")[i].split(":")[2];
      }

    }

    //solucion += recuperarSecreto(v, partesPol, primo);
    vecSolucion[i] = recuperarSecreto(v, partesPol, primo);
  }

  for(i=vecSolucion.length-2;i>=0;i--){
    // if(i=vecSolucion.length-2){
    //   solucion+=vecSolucion[i].substring(padding-1, 7);
    // }
    solucion+=vecSolucion[i];
  }
  return solucion;
}



function recuperarSecreto(v, fv, p){

  //primero recuperamos los polinomios
  //Vamos a utilizar la libreria bigInteger hasta el final ya que necesitamos el modulo inverso

  var polinomios=[];
  var mult;
  var inverso;
  var solucion;
  for( i=0; i<v.length;i++){
    mult =bigInt(1,10);

    for( j=0; j<fv.length; j++){
      if(i!=j){
        mult = (bigInt(v[i],16).minus(v[j])).multiply(mult);
      }
    }

    mult=mult.mod(p);
    inverso = mult.modInv(p);
    polinomios[i]=bigInt(fv[i],16).multiply(inverso);

  }

  mult = bigInt(1,10);
  var valores=[];

  for( i=0; i<polinomios.length;i++){
    mult = bigInt(1,10);
    for(j=0;j<polinomios.length;j++){
      if(i!=j){
        mult= bigInt(v[j],16).multiply(mult);
      }
    }

    valores[i]= (polinomios[i].multiply(mult));
  }

  solucion = bigInt(0,16);
  for( i = 0; i<valores.length;i++){
    solucion=solucion.add(valores[i]);
  }
  if(solucion.isNegative()==true){
    solucion=solucion.multiply(-1);
  }

  return hex2str(solucion.mod(p).toString(16));




}




function generar(){

  var myNode = document.getElementById("divPartes");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  //primero se encripta
  //luego pasamos el secreto encriptado de string a hexadecimal
  //luego se divide el secreto(se llama a la funcion que divide el secreto)


  var n = document.getElementById('necesarias').value;
  var m = document.getElementById('todas').value;
  var secreto = String(document.getElementById('secreto').value)
  var secretoHex = ascii_to_hexa(secreto);
  secretoHex=bigInt(secretoHex,16);
  secretoHex=secretoHex.toString(16);
  var primo;
  var subcadena;
  var quedan;
  var indiceFinal;
  var index;

  var secretoPorBloques=[];//aqui se almacenan los bloques del secreto
  var indice=0;
  for(i=0;i<secretoHex.length;i=i+8){//divivim el secret en bloques de 4 bytes
    subcadena="";
    quedan=8;
    index=i;
    if((i+8)>secretoHex.length){
      quedan=secretoHex.length -i;
    }
    for(j=0; j<quedan;j++){
      subcadena= subcadena + secretoHex.charAt(index);
      index++;
    }
    if(quedan!=8){
      for(j=0; j<8-quedan;j+=2){
        subcadena=subcadena + "20";
      }
    }
    secretoPorBloques[indice]=subcadena;
    indice++;
  }


  //GENERAMOS UN PRIMO ALEATORIO
  var primo = bigInt.randBetween("1e19", "1e20");
  while(primo.isProbablePrime(10)==false){
    primo = bigInt.randBetween("1e19", "1e20");
  }


  //AHORA VAMOS A GENERAR LAS CADENAS QUE CIFRAREMOS
  var aCifrar=[m];
  for(i=0;i<=m;i++){
    aCifrar[i]=(8-quedan)+":";//añadimos el pading en la cadena para saberlo
  }
  var vecTemporal;
  for(i=0;i<secretoPorBloques.length;i++){
    aux=i;
    vecTemporal=dividirSecreto(bigInt(secretoPorBloques[i],16),m, n, primo);
    i=aux;
    for(j=1;j<=m;j++){//concatenem en cada cadena el element "i" de cada bloq. PE:aCrifrar[1] serà totes les primeres particions de la llista de bloques(secretoPorBloques)
      aCifrar[j] = String(aCifrar[j]) + primo.toString(16) +":" + j +":" +vecTemporal[j] + "-";//FORMATO---> primo:j:numeros[i]-

    }

  }

  //AHORA CIFRAMOS CADA CADENA
  var cifrados=[];
  for(i=0;i<aCifrar.length -1;i++){
    cifrados[i]=str2hex(String(encrypt(aCifrar[i+1])));
  }

  var divPartes=document.getElementById("divPartes");
  var table = document.createElement("table");

  for(i=0;i<cifrados.length;i++){
    var nuevoDiv = document.createElement("textarea");
    var correu = document.createElement("input");
    // var a = document.createElement("a");
    // a.appendChild(linkText);
    // a.href="mailto:john@example.com";
    // a.title = "Enviar por correo a";
    var link=document.createElement("a");
    link.appendChild(document.createTextNode("Enviar parte por email"));
    link.href = 'mailto:correo@example.com?Subject=PARTE DEL SECRETO&body=' + cifrados[i];
    nuevoDiv.cols="70";
    nuevoDiv.value = cifrados[i];
    nuevoDiv.readOnly=true;
    let newRow=table.insertRow(-1);
    let newCell = newRow.insertCell(0);
    document.getElementById("divPartes").appendChild(nuevoDiv);
    document.getElementById("divPartes").appendChild(link);



  }
  //document.getElementById('dividido').value=cifrados.join("\n\n");
}


function dividirSecreto(secretoGrande, m, n, primo){

  var parte;
  var numeros=[];
  var polinomioF=[];
  for(i=1; i < n; i++){
    polinomioF[i]=bigInt.randBetween("1e9","9e9").add(1);
  }

//estos dos fors anidats creen m ecuacions(parts). Cada part es un polinomi de manera --> F(v) = (xn-1vn-1 + xn-2vn-2 + ... + x2v2 + x1v1 + S) modulo p
  for(i=1; i<=m; i++){//Generar m ecuacions
    numeros[i]=secretoGrande;
    for(j=1;j<polinomioF.length;j++){//Generem una ecuacio
      numeros[i]=numeros[i].add(polinomioF[j].multiply((bigInt(i).pow(j))));
    }
    numeros[i]=numeros[i].mod(primo).toString(16);//modulo
  }

  return numeros;
}




function bin2hex(str){

  var hex = '', num;
	str = padLeft(str, 4);
	for(var i=str.length; i>=4; i-=4){
		num = parseInt(str.slice(i-4, i), 2);
		if(isNaN(num)){
			throw new Error('Invalid binary character.')
		}
		hex = num.toString(16) + hex;
	}
return hex;

}

function padLeft(str, bits){
	bits = bits || config.bits
	var missing = str.length % bits;
	return (missing ? new Array(bits - missing + 1).join('0') : '') + str;
}

function str2hex(str){

  if(typeof str !== 'string'){
		throw new Error(typeof str);
	}

	var hexChars = 2;
	var max = Math.pow(16, hexChars) - 1;
	var out = '', num;
	for(var i=0, len=str.length; i<len; i++){
		num = str[i].charCodeAt();
		if(isNaN(num)){
			throw new Error('Invalid character: ' + str[i]);
		}else if(num > max){
			var neededBytes = Math.ceil(Math.log(num+1)/Math.log(256));
			throw new Error('Invalid character code (' + num +'). Maximum allowable is 256^bytes-1 (' + max + '). To convert this character, use at least ' + neededBytes + ' bytes.')
		}else{
			out = padLeft(num.toString(16), hexChars) + out;
		}
	}
return out;

}

function hex2str(str1)
 {
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str.reverse();
 }


 String.prototype.reverse = function() {

  var x = this.length;
  var cadena = "";
  while (x>=0) {
    cadena = cadena + this.charAt(x);
    x--;
  }
  return cadena;

}



function ascii_to_hexa(str)
  {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++)
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
   }
