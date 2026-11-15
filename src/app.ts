import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import { getAllComments, addComment, deleteAllComments } from './comments.ts';
import { getAllUsers, addUser, deleteAllUsers } from './users.ts';

const app = express();
app.set("views", path.join(import.meta.dirname, "views"));
app.set('view engine', 'pug');

// port: na Renderu dolazi iz process.env.PORT, lokalno fallback (npr. 4080)
const port = Number(process.env.PORT) || 4080;

// HTML forme šalju tijelo kao application/x-www-form-urlencoded (npr. "content=abc&xss=on") -> bez ovoga bi req.body bio undefined
// 1. provjeri se zaglavlje Content-Type -> ako nije application/x-www-form-urlencoded -> ovaj middleware ne radi ništa
// Inače: 2. pročita cijeli body sa streama;  3. dekodira ga (%3C → <) i rastavi na parove; 4. rezultat stavi u req.body
// extended: false -> određuje da se koristi ugrađeni querystring: { 'user[name]': 'ana' } -> koristi se ovo umjesto ugniježđavanja: {user:{name:'ana'}}
app.use(express.urlencoded({ extended: false }));

app.get('/', async function (req, res) {
  // stanje prekidača dolazi iz URL-a nakon redirecta; bez parametra = isključeno
  const xssEnabled = req.query.xss === 'on';
  const sdeEnabled = req.query.sde === 'on';
  const [comments, users] = await Promise.all([getAllComments(), getAllUsers()]);
  
  // demo "sesijski" cookie: kad je ranjivost isključena, HttpOnly ga skriva od JavaScripta (document.cookie)
  // ne radimo autentifikaciju pa se šalje randomUUID koji samo simulira cookie (da bi se prikazao xss)
  // tu radimo novi cookie jer ovisno jel httpOnly uključen/isključen treba postaviti httpOnly zastavicu, a najlakše je samo novi cookie napravit
  // u pravoj situaciji: httpOnly bi uvijek bio postavljen na true te bi se cookie dodijeljivao kod prve autentifikacije/prijave (i nakon expire-ija)
  res.cookie('sessionId', randomUUID(), { httpOnly: !xssEnabled });
  
  res.render('index', { xssEnabled, sdeEnabled, comments, users });
});

app.post('/comments', async function (req, res) {
  // checkbox se šalje kao "on" samo ako je označen; ako nije, polja uopće nema u body-ju
  const xssEnabled = req.body.xss === 'on';
  const content = req.body.content;
  if (typeof content !== 'string' || !content.trim()) {
    res.sendStatus(400);
    return;
  }
  await addComment(content);
  
  // redirect se radi kako refresh forme, nebi radio duplikate u bazi, nego samo napravio novi get zahtjev na specificirani url
  res.redirect(`/?xss=${xssEnabled ? 'on' : 'off'}`);
});

app.post('/comments/clear', async function (req, res) {
  await deleteAllComments();
  res.redirect('/');
});

app.post('/users', async function (req, res) {
  const sdeEnabled = req.body.sde === 'on';
  const username = req.body.username;
  const password = req.body.password;
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    res.sendStatus(400);
    return;
  }
  await addUser(username.trim(), password, sdeEnabled);
  res.redirect(`/?sde=${sdeEnabled ? 'on' : 'off'}`);
});

app.post('/users/clear', async function (req, res) {
  await deleteAllUsers();
  res.redirect('/');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});