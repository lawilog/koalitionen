var koaltionen_party_colors = 'black red purple green lightblue #FFF000 blue darkorange saddlebrown darkblue crimson turquoise hotpink lawngreen gray'.split(' ');

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
    new Partei("Grüne", 8, 3),
    new Partei("SPD", 7, 1),
    new Partei("Linke", 31, 2),
    new Partei("AfD", 23, 6),
    new Partei("FDP", 6, 5)
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
    this.partylist.list.sort((a,b) => b.prozent - a.prozent);

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

function colorChooserSizes()
{
  const boxa = 25;
  const bordr = boxa/6;
  return {
    boxa : boxa,
    bordr : bordr,
    step : boxa + 2*bordr
  };
}

function addSpace(parent : HTMLElement, width : number)
{
  let space = parent.appendChild(document.createElement('span'));
  space.style.width = width + 'px';
  space.style.display = 'inline-block';
}

function keepGoodChars(str : string) : string
{
  return str.replace(/[^A-Za-z +/]/g, '');
}

function shareLink(partylist : Partei[]) : string
{
  const reflist = exampleParteiData();
  let percentages : string[] = [];
  let names : string[] = [];
  let colorindice : string[] = [];
  for(let i = 0; i < partylist.length; ++i)
  {
    percentages.push(partylist[i].prozent.toString());
    names.push(i < reflist.length && partylist[i].name == reflist[i].name
      ? '' : partylist[i].name
    );
    colorindice.push((i < reflist.length
        && partylist[i].colorindex == reflist[i].colorindex
        ? '' : partylist[i].colorindex).toString()
    );
  }
  let url = window.location.protocol + '//' + window.location.hostname + window.location.pathname + '?p=' + percentages.join(',');

  if(! names.every(n => n==''))
    url += '&n=' + names.map(n => encodeURIComponent(keepGoodChars(n))).join(',');
  
  if(! colorindice.every(ci => ci==''))
    url += '&c=' + colorindice.join(',');

  return url;
}

function parteiDataOfQuery(querystr : string) : Partei[]
{
  let ppl : Partei[] = [];

  const getQueryParam = (qstr : string, param : string) => {
    const rx = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)');
    const results = rx.exec(qstr);
    if(!results || !results[2])
      return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };
  const ps = getQueryParam(querystr, 'p');
  const reflist = exampleParteiData();
  if(ps == '')
    return reflist;

  const percentages = ps.split(',');
  const names = getQueryParam(querystr, 'n').split(',');
  const colorindice = getQueryParam(querystr, 'c').split(',');
  for(let i = 0; i < percentages.length; ++i)
  {
    let n = 'Partei '+(i+1).toString();
    let c = i % koaltionen_party_colors.length;

    if(i < reflist.length)
    {
      n = reflist[i].name;
      c = reflist[i].colorindex;
    }
    
    if(i < names.length && names[i] != '')
      n = names[i];
    
    if(i < colorindice.length && colorindice[i] != '')
      c = Number(colorindice[i]);

    ppl.push(new Partei(n, Number(percentages[i]), c));
  }

  return ppl;
}

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
    inputdiv.classList.add('party_input');

    let startdata : Partei[] = [];
    const qpos = window.location.href.indexOf('?');
    if(qpos == -1)
      startdata = exampleParteiData();
    else
      startdata = parteiDataOfQuery(window.location.href.substr(qpos));
    
    this.buildInputTable(startdata);

    let correct5 = inputdiv.appendChild(document.createElement('input'));
    correct5.type = 'checkbox';
    correct5.id = this.inputdivid + 'correct5';
    correct5.checked = true;
    correct5.onclick = () => this.recalcAndShow();

    let check5label = inputdiv.appendChild(document.createElement('label'));
    check5label.htmlFor = correct5.id;
    check5label.innerText = ' 5%-Hürde';

    inputdiv.appendChild(document.createElement('br'));
    // let spandist1 = inputdiv.appendChild(document.createElement('span'));
    // spandist1.innerText = '|';
    // spandist1.className = 'butdist';

    let autoupd = inputdiv.appendChild(document.createElement('input'));
    autoupd.type = 'checkbox';
    autoupd.id = this.inputdivid + 'autoupd';
    autoupd.checked = true;
    autoupd.onchange = () => this.registerAutorefresh();

    let autoupdlabel = inputdiv.appendChild(document.createElement('label'));
    autoupdlabel.htmlFor = autoupd.id;
    autoupdlabel.innerText = ' automatisch neu berechnen';

    //inputdiv.appendChild(document.createElement('br'));
    let spandist2 = inputdiv.appendChild(document.createElement('span'));
    spandist2.innerText = '|';
    spandist2.className = 'butdist';

    let updbutton = inputdiv.appendChild(document.createElement('span'));
    updbutton.classList.add('party_button', 'button');
    updbutton.style.width = '150px';
    updbutton.innerText = 'jetzt neu berechnen';
    updbutton.onclick = () => this.recalcAndShow();

    inputdiv.appendChild(document.createElement('br'));
    let spanextlink = inputdiv.appendChild(document.createElement('span'));
    spanextlink.classList.add('koafootnote');
    spanextlink.appendChild(document.createTextNode('Tip: Aktuelle Umfragewerte gibt es bei '));
    let aext = spanextlink.appendChild(document.createElement('a'));
    aext.href = 'https://www.wahlrecht.de/umfragen/';
    aext.text = 'wahlrecht.de';
    spanextlink.appendChild(document.createTextNode('.'))

    this.registerAutorefresh();
  }

  buildInputTable(partydata : Partei[])
  {
    let inputdiv = document.getElementById(this.inputdivid);

    let tab = inputdiv.appendChild(document.createElement('div'));
    tab.className = 'party_table';
    tab.id = this.inputdivid + '_tab';
    let row_h = tab.appendChild(document.createElement('div'));
    row_h.className = 'party_table_header';
    addSpace(row_h, 75);
    row_h.appendChild(document.createElement('span')).innerText = 'Partei';
    addSpace(row_h, 92);
    row_h.appendChild(document.createElement('span')).innerText = 'Anteil';
    addSpace(row_h, 55);
    row_h.appendChild(document.createElement('span')).innerText = 'rechnerisch';
    for(let i = 0; i < partydata.length; ++i)
    {
      let row = tab.appendChild(document.createElement('div'));
      this.buildInputTableRow(row, partydata[i]);
    }
    let row_f = tab.appendChild(document.createElement('div'));
    row_f.className = 'party_table_footer';
    let cellpm = row_f.appendChild(document.createElement('span'));
    let buttom_p = cellpm.appendChild(document.createElement('span'));
    buttom_p.classList.add('party_button', 'button')
    buttom_p.innerText = '✚';
    buttom_p.onclick = () => this.addRow();

    // TODO add uncorrected sum underneath entered values
    addSpace(row_f, 280);
    let cellout = row_f.appendChild(document.createElement('span'));
    cellout.innerText = '100 %';
    cellout.style.paddingLeft = '25px';
    cellout.style.paddingRight = '15px';
    cellout.style.borderTop = 'black 1px solid';
  }

  buildInputTableRow(row : HTMLDivElement, party : Partei)
  {
    row.className = 'party_row';
    let buttom_m = row.appendChild(document.createElement('span'));
    buttom_m.classList.add('party_button', 'button');
    buttom_m.innerText = '✘';
    buttom_m.onclick = () => this.removeRow(row);

    let strike = row.appendChild(document.createElement('span'));
    strike.className = 'party_strike';

    const cs = colorChooserSizes();
    let cellcol = row.appendChild(document.createElement('span'));
    cellcol.className = 'party_color_single';
    cellcol.style.width = cs.step+'px';
    cellcol.style.height = cs.step+'px';
    let hiddencol = row.appendChild(document.createElement('input'));
    hiddencol.type = 'hidden';
    hiddencol.classList.add('farbindex');
    hiddencol.value = party.colorindex.toString();

    let spancol = this.buildColorItem(cellcol, koaltionen_party_colors[party.colorindex]);

    let divcol = this.buildColorChooser(cellcol, spancol, hiddencol);
    divcol.style.zIndex = '2';
    divcol.style.display = 'none';
    divcol.style.top = '0px';
    divcol.style.left = '0px';
    spancol.onclick = () => {divcol.style.display = 'block';};
    divcol.onmouseleave = () => {divcol.style.display = 'none';};
    document.addEventListener('click', function(event) {
      if(!cellcol.contains(<Node>event.target)) // this
        divcol.style.display = 'none';
    });

    let inputname = row.appendChild(document.createElement('input'));
    inputname.type = 'text';
    inputname.classList.add('party_name');
    inputname.value = party.name;

    let inputproz = row.appendChild(document.createElement('input'));
    inputproz.type = 'text';
    inputproz.classList.add('party_percent');
    inputproz.value = party.prozent.toString();

    let spanout = row.appendChild(document.createElement('span'));
    spanout.classList.add('party_scaledout');
    // TODO link header
    // TODO favicon
  }

  buildColorChooser(parent : HTMLElement, spandisp : HTMLElement, farbindexelem : HTMLInputElement)
  {
    const cs = colorChooserSizes();
    const n_rows = Math.floor(Math.sqrt(koaltionen_party_colors.length));
    const n_cols = Math.ceil(koaltionen_party_colors.length / n_rows);
    let divcol = parent.appendChild(document.createElement('div'));
    divcol.className = 'party_colorchooser';
    divcol.style.width = n_cols * cs.step + 'px';
    divcol.style.height = n_rows * cs.step + 'px';
    for(let i = 0; i < koaltionen_party_colors.length; ++i)
    {
      let spancol = this.buildColorItem(divcol, koaltionen_party_colors[i], Math.floor(i/n_cols), Math.floor(i % n_cols));
      spancol.onclick = () => {
        spandisp.style.backgroundColor = koaltionen_party_colors[i];
        divcol.style.display = 'none';
        farbindexelem.value = i.toString();
        this.recalcAndShow();
      };
    }
    return divcol;
  }

  buildColorItem(parent: HTMLElement, color : string, top : number = 0, left : number = 0)
  {
    const cs = colorChooserSizes();
    let spancol = parent.appendChild(document.createElement('span'));
    spancol.className = 'party_color';
    spancol.style.top = top * cs.step + 'px';
    spancol.style.left = left * cs.step + 'px';
    spancol.style.width = cs.boxa + 'px';
    spancol.style.height = cs.boxa + 'px';
    spancol.style.borderWidth = cs.bordr + 'px';
    spancol.style.borderRadius = (3*cs.bordr) + 'px';
    spancol.style.backgroundColor = color;
    return spancol;
  }

  addRow()
  {
    let tab = document.getElementById(this.inputdivid + '_tab');
    let row = tab.insertBefore(document.createElement('div'), tab.getElementsByClassName('party_table_footer')[0]);
    this.buildInputTableRow(row, new Partei('', 0, 14));
    this.registerAutorefresh();
  }

  removeRow(row : HTMLDivElement)
  {
    row.remove();
    this.recalcAndShow();
  }

  registerAutorefresh()
  {
    // TODO also on name change
    const ereg = <HTMLInputElement> document.getElementById(this.inputdivid + 'autoupd');
    const register = ereg.checked;
    let pes = document.getElementsByClassName('party_percent');
    for(let i = 0; i < pes.length; ++i)
      (<HTMLInputElement>pes[i])
        .onkeyup = register ? (() => this.recalcAndShow()) : (() => 0);
    
    if(register)
      this.recalcAndShow();
  }

  recalcAndShow()
  {
    let outputdiv = document.getElementById(this.outputdivid);
    outputdiv.innerHTML = '';

    let divshare = outputdiv.appendChild(document.createElement('div'));
    divshare.className = 'koa_share';
    let ashare = divshare.appendChild(document.createElement('a'));
    ashare.className = 'ashare';
    ashare.innerText = '[Sharelink zu diesen Ergebnissen]';

    let ppl = new ParteiList();
    const tab = <HTMLDivElement>document.getElementById(this.inputdivid + '_tab');
    const rows = tab.getElementsByClassName('party_row');
    for(let i = 0; i < rows.length; ++i)
    {
      const hn = rows[i].getElementsByClassName('party_name');
      const hp = rows[i].getElementsByClassName('party_percent');
      const hc = rows[i].getElementsByClassName('farbindex');
      if(hn.length == 0 || hp.length == 0 || hc.length == 0)
        continue;

      const name = (<HTMLInputElement> hn[0]).value;
      const prozent = Number((<HTMLInputElement> hp[0]).value.replace(/,/, '.'));
      const colorindex = Number((<HTMLInputElement> hc[0]).value);
      ppl.list.push(new Partei(name, prozent, colorindex));
    }
    ashare.href = shareLink(ppl.list);

    if(! ppl.scaleProz())
    {
      outputdiv.innerText = 'Bitte nur Zahlen als Eingabe verwenden.';
      return;
    }

    const correct5 = (<HTMLInputElement>document.getElementById(this.inputdivid + 'correct5')).checked;
    if(correct5)
      ppl.correct5PerzLimit();
    
    for(let i = 0; i < rows.length; ++i)
    {
      if(i > ppl.list.length)
        break;

      const perc = 100*ppl.list[i].prozent;
      let e_scaledout = <HTMLElement> rows[i].getElementsByClassName('party_scaledout')[0];
      e_scaledout.innerText = '→ '+perc.toFixed(1)+' %';
      if(perc == 0)
        e_scaledout.classList.add('party_ignored');
      else
        e_scaledout.classList.remove('party_ignored');
    }

    let coas = new PossibleCoalitions(ppl);
    // coas.print();

    let outcan = outputdiv.appendChild(document.createElement('canvas'));
    outcan.id = this.outputdivid + '_canvas';
    const barwidth = 300;
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
    const maxfraction = ((coas.koas.length > 0 && coas.koas[0].sumproz < 90) ? (coas.koas[0].sumproz + 10) : 100) / 100;
    outcan.width = barwidth * maxfraction + descrwidth;
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
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, barwidth*maxfraction - x, barheight);

        ctx.beginPath();
        ctx.rect(0, y, barwidth*maxfraction, barheight);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillText(koa.humanReadableDescription(coas.partylist), barwidth*maxfraction + xdescrdist, y + barheight - fontdescrheight/2);

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
