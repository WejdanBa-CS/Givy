# Givy

Centralized gift registries for birthdays, holidays, weddings, and local giveaways.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## App screens

| Route | What it does |
| --- | --- |
| `/` | Marketing landing |
| `/login` | Demo sign-in (Google / Apple / Facebook) |
| `/app` | Home — next event, lists, giveaways, activity |
| `/app/lists` | All your Givies (filter by occasion) |
| `/app/create` | Create a new list |
| `/app/[id]` | Manage gifts, address, share link |
| `/g/[code]` | Public shared list — claim gifts anonymously |
| `/app/giveaways` | Local giveaways — join or draw a winner |
| `/app/activity` | Claim / share / giveaway events |
| `/app/profile` | Account + sign out |

## MVP notes

- Data is stored in the browser (`localStorage`) so shared links work on the same device
- First sign-in seeds a birthday list, holiday draft, and sample giveaways
- Claimed gifts are grayed out without showing who bought them
