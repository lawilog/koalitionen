var koaltionen_party_colors = [
  'black',
  'red',
  'green',
  'crimson',
  'yellow',
  'blue',
  'orange',
  'brown',
  'purple',
  'pink',
  'chocolate',
  'darkgreen',
  'darkblue',
  'darkmagenta',
  'lawngreen',
  'turquoise'
];

class Partei
{
  name : string;
  prozent : number;
  colorindex : number;

  constructor(name : string, prozent : number, colorindex : number)
  {
    this.name = name;
    this.prozent = prozent;
    this.colorindex = colorindex;
  }
}

function exampleParteiData() : Partei[]
{
  return [
    new Partei("CDU", 22, 0),
    new Partei("Grüne", 8, 2),
    new Partei("SPD", 7, 1),
    new Partei("Linke", 31, 3),
    new Partei("AfD", 23, 5),
    new Partei("FDP", 6, 4)
  ];
}

class ParteiList
{
  list : Partei[];

  constructor()
  {
    this.list = [];
  }

  fillCurrentUmfragen()
  {
    this.list = exampleParteiData();
  }

  scaleProz() : boolean
  {
    let sum = 0;
    for(let p of this.list)
      sum += p.prozent;
    
    if(isNaN(sum))
      return false;
    
    for(let p of this.list)
      p.prozent /= sum;
    
    return true;
  }

  correct5PerzLimit()
  {
    this.list.forEach((p, i, list) => {if(p.prozent < 0.05) list[i].prozent = 0;});
    this.scaleProz();
  }

  removeZeros()
  {
    this.list = this.list.filter(function(val) {return val.prozent != 0;});
  }

  print()
  {
    for(let p of this.list)
      console.log((p.prozent*100).toFixed(1), '%', p.name);
  }
}

class Coalition
{
  sumproz : number;
  indice : number[];

  constructor(sumproz : number)
  {
    this.sumproz = sumproz;
    this.indice = [];
  }

  humanReadableDescription(partylist : ParteiList) : string
  {
    let str = this.sumproz.toFixed(1) + '%: ';
    let first = true;
    for(let j = 0; j < this.indice.length; ++j)
    {
      if(first)
        first = false;
      else
        str += ' + ';
      
      const i = this.indice[j];
      str += partylist.list[i].name;
    }
    return str;
  }
}

class PossibleCoalitions
{
  partylist : ParteiList;
  koas : Coalition[];
  nonkoas : Coalition[];

  constructor(partylist : ParteiList)
  {
    this.partylist = partylist;
    this.koas = [];
    this.nonkoas = [];

    this.partylist.removeZeros();

    let b = new Array(partylist.list.length);
    for(let i = 0; i < partylist.list.length; ++i)
      b[i] = false;
    
    b[0] = true; // actually, dont try empty subset
    do
    {
      let sumpro = 0;
      for(let i = 0; i < partylist.list.length; ++i)
        if(b[i])
          sumpro += partylist.list[i].prozent;
      
      if(sumpro >= 0.5)
      {
        let every_needed = true;
        for(let i = 0; i < partylist.list.length; ++i)
        {
          if(b[i] && sumpro - partylist.list[i].prozent >= 0.5)
          {
            every_needed = false;
            break;
          }
        }
        
        if(every_needed)
        {
          let koa = new Coalition(100 * sumpro);
          for(let i = 0; i < partylist.list.length; ++i)
          {
            if(b[i])
              koa.indice.push(i);
          }
          this.koas.push(koa);
        }
      }
      else
      {
        let nonkoa = new Coalition(100 * sumpro);
        for(let i = 0; i < partylist.list.length; ++i)
        {
          if(b[i])
            nonkoa.indice.push(i);
        }
        this.nonkoas.push(nonkoa);
      }
      
      // next combination:
      let i = 0;
      for(; i < partylist.list.length; ++i)
      {
        if(b[i]) b[i] = false;
        else {b[i] = true; break;}
      }
      if(i == partylist.list.length)
        break;
      
    } while(true);

    this.koas.sort((a,b) => b.sumproz - a.sumproz);
    this.nonkoas.sort((a,b) => b.sumproz - a.sumproz);
  }

  print()
  {
    let pr = (ks : Coalition[]) =>
    {
      if(! ks)
      {
        console.log('keine');
        return;
      }
      for(let koa of ks)
        console.log(koa.humanReadableDescription(this.partylist));
    };
    console.log('Rechnerisch mögliche Koaltionen:');
    pr(this.koas);
    console.log('Nicht-Mehrheiten:');
    pr(this.nonkoas);
  }
}

/* let ppl = new ParteiList();
ppl.fillCurrentUmfragen();
console.log('Nach 5%-Hürde Verteilung:');
ppl.scaleProz();
ppl.correct5PerzLimit();
ppl.print();

let coas = new PossibleCoalitions(ppl);
coas.print(); */

class KoasSite
{
  inputdivid : string;
  outputdivid : string;

  constructor(inputdivid : string, outputdivid : string)
  {
    this.inputdivid = inputdivid;
    this.outputdivid = outputdivid;
  }

  build()
  {
    let inputdiv = document.getElementById(this.inputdivid);
    let table = inputdiv.appendChild(document.createElement('table'));
    table.id = this.inputdivid + '_tab';
    let tr_h = table.appendChild(document.createElement('tr'));
    ['Farbe', 'Partei', 'Anteil', 'rechnerisch'].forEach(h => {
      let th = tr_h.appendChild(document.createElement('th'));
      th.innerText = h;
    });

    const startdata = exampleParteiData();
    for(let i = 0; i < startdata.length; ++i)
    {
      let tr = table.appendChild(document.createElement('tr'));
      let td0 = tr.appendChild(document.createElement('td'));
      let selectcol = td0.appendChild(document.createElement('select'));
      selectcol.id = this.inputdivid + '_farbe_'+i;
      for(let c = 0; c < koaltionen_party_colors.length; ++c)
      {
        let optcol = selectcol.appendChild(document.createElement('option'));
        optcol.value = c.toString();
        optcol.text = koaltionen_party_colors[c];
        if(startdata[i].colorindex == c)
          optcol.selected = true;
      }

      let td1 = tr.appendChild(document.createElement('td'));
      let inputname = td1.appendChild(document.createElement('input'));
      inputname.type = 'text';
      inputname.id = this.inputdivid + '_partei_'+i;
      inputname.size = 10;
      inputname.value = startdata[i].name;

      let td2 = tr.appendChild(document.createElement('td'));
      let inputproz = td2.appendChild(document.createElement('input'));
      inputproz.type = 'text';
      inputproz.id = this.inputdivid + '_prozent_'+i;
      inputproz.size = 10;
      inputproz.value = startdata[i].prozent.toString();

      let td3 = tr.appendChild(document.createElement('td'));
      td3.id = this.inputdivid + '_scaledout_'+i;
    }

    let correct5 = inputdiv.appendChild(document.createElement('input'));
    correct5.type = 'checkbox';
    correct5.id = this.inputdivid + 'correct5';
    correct5.checked = true;
    correct5.onclick = () => this.recalcAndShow();

    let check5label = inputdiv.appendChild(document.createElement('label'));
    check5label.htmlFor = correct5.id;
    check5label.innerText = ' 5%-Hürde';

    inputdiv.appendChild(document.createElement('br'));

    let autoupd = inputdiv.appendChild(document.createElement('input'));
    autoupd.type = 'checkbox';
    autoupd.id = this.inputdivid + 'autoupd';
    autoupd.checked = true;
    autoupd.onchange = () => this.registerAutorefresh();

    let autoupdlabel = inputdiv.appendChild(document.createElement('label'));
    autoupdlabel.htmlFor = autoupd.id;
    autoupdlabel.innerText = ' automatisch neu berechnen';

    inputdiv.appendChild(document.createElement('br'));

    let updbutton = inputdiv.appendChild(document.createElement('button'));
    updbutton.innerText = 'jetzt neu berechnen';
    updbutton.onclick = () => this.recalcAndShow();

    this.registerAutorefresh();
  }

  registerAutorefresh()
  {
    const ereg = <HTMLInputElement> document.getElementById(this.inputdivid + 'autoupd');
    const register = ereg.checked;
    let e_prozent : HTMLInputElement;
    for(let i = 0; e_prozent = <HTMLInputElement>document.getElementById(this.inputdivid + '_prozent_'+i); ++i)
      e_prozent.onkeyup = register ? (() => this.recalcAndShow()) : (() => 0);
    
    if(register)
      this.recalcAndShow();
  }

  recalcAndShow()
  {
    let outputdiv = document.getElementById(this.outputdivid);

    let ppl = new ParteiList();
    let e_partei : HTMLInputElement, e_prozent : HTMLInputElement, e_farbe : HTMLSelectElement;
    for(let i = 0; e_prozent = <HTMLInputElement>document.getElementById(this.inputdivid + '_prozent_'+i); ++i)
    {
      e_partei = <HTMLInputElement>document.getElementById(this.inputdivid + '_partei_'+i);
      e_farbe = <HTMLSelectElement>document.getElementById(this.inputdivid + '_farbe_'+i);
      ppl.list.push(new Partei(
        e_partei.value,
        Number(e_prozent.value.replace(/,/, '.')),
        Number(e_farbe.value)
      ));
    }

    if(! ppl.scaleProz())
    {
      outputdiv.innerText = 'Bitte nur Zahlen als Eingabe verwenden.';
      return;
    }

    const correct5 = (<HTMLInputElement>document.getElementById(this.inputdivid + 'correct5')).checked;
    if(correct5)
      ppl.correct5PerzLimit();
    
    for(let i = 0; i < ppl.list.length; ++i)
    {
      const perc = 100*ppl.list[i].prozent;
      let e_scaledout = document.getElementById(this.inputdivid + '_scaledout_'+i);
      e_scaledout.innerText = '→ '+perc.toFixed(1)+' %';
      if(perc == 0)
        e_scaledout.classList.add('koaignoredparty');
      else
        e_scaledout.classList.remove('koaignoredparty');
    }

    let coas = new PossibleCoalitions(ppl);
    coas.print();

    outputdiv.innerHTML = '';
    let outcan = outputdiv.appendChild(document.createElement('canvas'));
    outcan.id = this.outputdivid + '_canvas';
    const barwidth = 400;
    const descrwidth = 300;
    const barheight = 20;
    const ybarstart = 30;
    const ybardistance = 10;
    const ynonkoadist = 30;
    const ynonkoabardist = 10;
    const xdescrdist = 10;
    const fontdescrheight = 14; // px
    const fontdescr = fontdescrheight+'px Arial';
    const fonthead = '20px Arial';
    outcan.width = barwidth + descrwidth;
    outcan.height = ybarstart + ynonkoadist + ynonkoabardist + (barheight + ybardistance)*(coas.koas.length + coas.nonkoas.length);
    let ctx = outcan.getContext('2d');

    ctx.font = fonthead;
    ctx.fillText('Die Mehrheit hätten:', 0, 20); 

    let drawkoas = (ystart : number, koas : Coalition[]) =>
    {
      ctx.font = fontdescr;
      ctx.lineWidth = 1;
      let y = ystart;
      for(let koa of koas)
      {
        let x = 0;
        for(let i of koa.indice)
        {
          const pw = barwidth * coas.partylist.list[i].prozent;
          ctx.fillStyle = koaltionen_party_colors[coas.partylist.list[i].colorindex];
          ctx.fillRect(x, y, pw, barheight);
          x += pw;
        }
        ctx.beginPath();
        ctx.rect(0, y, barwidth, barheight);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillText(koa.humanReadableDescription(coas.partylist), barwidth + xdescrdist, y + barheight - fontdescrheight/2);

        y += barheight + ybardistance;
      }

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(barwidth / 2, ystart);
      ctx.lineTo(barwidth / 2, ystart + (barheight + ybardistance) * koas.length - ybardistance);
      ctx.stroke(); 
    };
    drawkoas(ybarstart, coas.koas);
    const yafterkoas = ybarstart + (barheight + ybardistance) * coas.koas.length + ynonkoadist;
    ctx.font = fonthead;
    ctx.fillText('Keine Mehrheit hätten:', 0, yafterkoas); 
    drawkoas(yafterkoas + ynonkoabardist, coas.nonkoas);

    // TODO: share link
    // TODO: add nice color-choser. inspiration for colors: https://htmlcolorcodes.com/color-names/
    // TODO: sort parties by percentage
    // TODO: upload and add online-link
    // TODO: plus minus buttons (add or remove party)
    // TODO: set viewport (700px?)
   
    // outputdiv.innerText = JSON.stringify(coas.koas) + "\n" + JSON.stringify(coas.nonkoas);
    outputdiv.appendChild(document.createElement('hr'));
    let spanfoot = outputdiv.appendChild(document.createElement('span'));
    spanfoot.classList.add('koafootnote');
    let alic = spanfoot.appendChild(document.createElement('a'));
    alic.href = 'https://creativecommons.org/licenses/by-sa/3.0/de/';
    alic.text = 'Lizenz:  cc-by-sa';
    spanfoot.appendChild(document.createTextNode(' - '));
    let ame = spanfoot.appendChild(document.createElement('a'));
    ame.href = 'https://github.com/lawilog/koalitionen';
    ame.text = 'Lars Winterfeld';
  }
}
