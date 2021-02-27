class PartProz
{
  partei : string;
  prozent : number;

  constructor(partei : string, prozent : number)
  {
    this.partei = partei;
    this.prozent = prozent;
  }
}

function examplePartProzData() : PartProz[]
{
  return [
    new PartProz("CDU", 22),
    new PartProz("Linke", 31),
    new PartProz("AfD", 23),
    new PartProz("Grüne", 8),
    new PartProz("FDP", 6)
  ];
}

class PartProzList
{
  list : PartProz[];

  constructor()
  {
    this.list = [];
  }

  fillCurrentUmfragen()
  {
    this.list = examplePartProzData();
  }

  scaleProz()
  {
    let sum = 0;
    for(let p of this.list)
      sum += p.prozent;
    
    for(let p of this.list)
      p.prozent /= sum;
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
      console.log((p.prozent*100).toFixed(1), '%', p.partei);
  }
}

interface Coalition
{
  sumproz : number;
  indice : number[];
}

class PossibleCoalitions
{
  umfragen : PartProzList;
  koas : Coalition[];
  nonkoas : Coalition[];

  constructor(umfragen : PartProzList)
  {
    this.umfragen = umfragen;
    this.koas = [];
    this.nonkoas = [];

    this.umfragen.removeZeros();

    let b = new Array(umfragen.list.length);
    for(let i = 0; i < umfragen.list.length; ++i)
      b[i] = false;
    
    b[0] = true; // actually, dont try empty subset
    do
    {
      let sumpro = 0;
      for(let i = 0; i < umfragen.list.length; ++i)
        if(b[i])
          sumpro += umfragen.list[i].prozent;
      
      if(sumpro >= 0.5)
      {
        let every_needed = true;
        for(let i = 0; i < umfragen.list.length; ++i)
        {
          if(b[i] && sumpro - umfragen.list[i].prozent >= 0.5)
          {
            every_needed = false;
            break;
          }
        }
        
        if(every_needed)
        {
          let koa : Coalition = {
            sumproz: 100 * sumpro,
            indice : []
          };
          for(let i = 0; i < umfragen.list.length; ++i)
          {
            if(b[i])
              koa.indice.push(i);
          }
          this.koas.push(koa);
        }
      }
      else
      {
        let nonkoa : Coalition = {
          sumproz: 100 * sumpro,
          indice : []
        };
        for(let i = 0; i < umfragen.list.length; ++i)
        {
          if(b[i])
            nonkoa.indice.push(i);
        }
        this.nonkoas.push(nonkoa);
      }
      
      // next combination:
      let i = 0;
      for(; i < umfragen.list.length; ++i)
      {
        if(b[i]) b[i] = false;
        else {b[i] = true; break;}
      }
      if(i == umfragen.list.length)
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
      {
        let str = koa.sumproz.toFixed(1) + '%: ';
        let first = true;
        for(let j = 0; j < koa.indice.length; ++j)
        {
          if(first)
            first = false;
          else
            str += ' + ';
          
          const i = koa.indice[j];
          str += this.umfragen.list[i].partei;
        }
        console.log(str);
      }
    };
    console.log('Rechnerisch mögliche Koaltionen:');
    pr(this.koas);
    console.log('Nicht-Mehrheiten:');
    pr(this.nonkoas);
  }
}

/* let ppl = new PartProzList();
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

    const startdata = examplePartProzData();
    for(let i = 0; i < startdata.length; ++i)
    {
      let tr = table.appendChild(document.createElement('tr'));
      let td0 = tr.appendChild(document.createElement('td'));
      td0.innerText = 'Farbe';

      let td1 = tr.appendChild(document.createElement('td'));
      let inputname = td1.appendChild(document.createElement('input'));
      inputname.type = 'text';
      inputname.id = this.inputdivid + '_partei_'+i;
      inputname.size = 10;
      inputname.value = startdata[i].partei;

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
    let ppl = new PartProzList();
    let e_partei : HTMLInputElement, e_prozent : HTMLInputElement;
    for(let i = 0; e_prozent = <HTMLInputElement>document.getElementById(this.inputdivid + '_prozent_'+i); ++i)
    {
      e_partei = <HTMLInputElement>document.getElementById(this.inputdivid + '_partei_'+i);
      ppl.list.push(new PartProz(e_partei.value, Number(e_prozent.value)));
      // TODO "4,9" -> "4.9"
    }

    ppl.scaleProz();

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

    let outputdiv = document.getElementById(this.outputdivid);
    outputdiv.innerText = JSON.stringify(coas.koas) + "\n" + JSON.stringify(coas.nonkoas);
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
