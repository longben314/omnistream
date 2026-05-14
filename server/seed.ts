import { db, uuidv4, initDatabase } from './database.js'

const musicTracks = [
  { title: '晚风', artist: '陈奕迅', album: '认了吧', genre: 'pop', language: 'zh', year: 2007, duration: 267 },
  { title: '晴天', artist: '周杰伦', album: '叶惠美', genre: 'pop', language: 'zh', year: 2003, duration: 269 },
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', genre: 'rock', language: 'en', year: 1975, duration: 354 },
  { title: '夜曲', artist: '周杰伦', album: '十一月的萧邦', genre: 'pop', language: 'zh', year: 2005, duration: 233 },
  { title: 'Strobe', artist: 'deadmau5', album: 'For Lack of a Better Name', genre: 'electronic', language: 'en', year: 2009, duration: 637 },
  { title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', genre: 'jazz', language: 'en', year: 1959, duration: 324 },
  { title: '月光奏鸣曲', artist: '郎朗', album: 'Beethoven Piano Sonatas', genre: 'classical', language: 'zh', year: 2012, duration: 900 },
  { title: '成都', artist: '赵雷', album: '无法长大', genre: 'folk', language: 'zh', year: 2016, duration: 328 },
  { title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile Soundtrack', genre: 'hiphop', language: 'en', year: 2002, duration: 326 },
  { title: '平凡之路', artist: '朴树', album: '猎户星座', genre: 'folk', language: 'zh', year: 2014, duration: 282 },
  { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', genre: 'rock', language: 'en', year: 1977, duration: 391 },
  { title: '光年之外', artist: '邓紫棋', album: '光年之外', genre: 'pop', language: 'zh', year: 2016, duration: 235 },
  { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', genre: 'electronic', language: 'en', year: 2011, duration: 243 },
  { title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', genre: 'jazz', language: 'en', year: 1959, duration: 561 },
  { title: '四季·春', artist: '吕思清', album: '维瓦尔第四季', genre: 'classical', language: 'zh', year: 2005, duration: 720 },
  { title: '南山南', artist: '马頔', album: '孤岛', genre: 'folk', language: 'zh', year: 2014, duration: 318 },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar', album: 'DAMN.', genre: 'hiphop', language: 'en', year: 2017, duration: 177 },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', genre: 'rock', language: 'en', year: 1991, duration: 301 },
  { title: '起风了', artist: '买辣椒也用券', album: '起风了', genre: 'pop', language: 'zh', year: 2017, duration: 315 },
  { title: 'Strobe (Deadmau5 Remix)', artist: 'deadmau5', album: '5 Years of mau5', genre: 'electronic', language: 'en', year: 2014, duration: 680 },
]

const movies = [
  { title: '流浪地球2', original_title: 'The Wandering Earth II', overview: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。', genres: 'scifi,action', language: 'zh', region: 'CN', rating: 8.3, release_date: '2023-01-22', runtime: 173, cast: '吴京,刘德华,李雪健', director: '郭帆' },
  { title: '星际穿越', original_title: 'Interstellar', overview: '一队探险家利用他们针对虫洞的新发现，超越人类对于太空旅行的极限。', genres: 'scifi,drama', language: 'en', region: 'US', rating: 9.4, release_date: '2014-11-07', runtime: 169, cast: 'Matthew McConaughey,Anne Hathaway,Jessica Chastain', director: 'Christopher Nolan' },
  { title: '你好，李焕英', original_title: 'Hi, Mom', overview: '贾晓玲在经历一次变故后意外穿越回到1981年，与年轻时的母亲相遇。', genres: 'comedy,drama', language: 'zh', region: 'CN', rating: 7.8, release_date: '2021-02-12', runtime: 128, cast: '贾玲,张小斐,沈腾', director: '贾玲' },
  { title: '盗梦空间', original_title: 'Inception', overview: '一个拥有进入他人梦境能力的窃贼，被赋予了一个近乎不可能的任务。', genres: 'scifi,action', language: 'en', region: 'US', rating: 9.3, release_date: '2010-07-16', runtime: 148, cast: 'Leonardo DiCaprio,Joseph Gordon-Levitt,Ellen Page', director: 'Christopher Nolan' },
  { title: '哪吒之魔童降世', original_title: 'Ne Zha', overview: '天地灵气孕育出能量巨大的混元珠，元始天尊将其提炼为灵珠和魔丸。', genres: 'animation,action', language: 'zh', region: 'CN', rating: 8.4, release_date: '2019-07-26', runtime: 110, cast: '吕艳婷,囧森瑟夫,瀚墨', director: '饺子' },
  { title: 'The Shawshank Redemption', original_title: 'The Shawshank Redemption', overview: '两个被囚禁的男人在多年间找到了慰藉和最终的救赎。', genres: 'drama', language: 'en', region: 'US', rating: 9.7, release_date: '1994-09-23', runtime: 142, cast: 'Tim Robbins,Morgan Freeman,Bob Gunton', director: 'Frank Darabont' },
  { title: '唐人街探案3', original_title: 'Detective Chinatown 3', overview: '唐仁和秦风受侦探野田昊邀请前往东京，调查一桩密室杀人案件。', genres: 'comedy,action', language: 'zh', region: 'CN', rating: 5.3, release_date: '2021-02-12', runtime: 136, cast: '王宝强,刘昊然,妻夫木聪', director: '陈思诚' },
  { title: 'Mad Max: Fury Road', original_title: 'Mad Max: Fury Road', overview: '在一个荒芜的未来世界中，一名叛逃的战士与一名逃亡的女性联手对抗暴君。', genres: 'action,scifi', language: 'en', region: 'AU', rating: 8.1, release_date: '2015-05-15', runtime: 120, cast: 'Tom Hardy,Charlize Theron,Nicholas Hoult', director: 'George Miller' },
  { title: '鬼灭之刃 无限列车篇', original_title: 'Demon Slayer: Mugen Train', overview: '炭治郎等人跟随炎柱炼狱杏寿郎前往无限列车，调查失踪事件。', genres: 'animation,action', language: 'ja', region: 'JP', rating: 8.7, release_date: '2020-10-16', runtime: 117, cast: '花江夏树,鬼头明里,下野纮', director: '外崎春雄' },
  { title: 'Get Out', original_title: 'Get Out', overview: '一名年轻非裔美国人前往女友父母家中度周末，发现了令人不安的秘密。', genres: 'horror', language: 'en', region: 'US', rating: 7.7, release_date: '2017-02-24', runtime: 104, cast: 'Daniel Kaluuya,Allison Williams,Bradley Whitford', director: 'Jordan Peele' },
  { title: '满江红', original_title: 'Full River Red', overview: '南宋绍兴年间，一场精心策划的阴谋在宰相秦桧的驻地产开。', genres: 'action,drama', language: 'zh', region: 'CN', rating: 7.0, release_date: '2023-01-22', runtime: 159, cast: '沈腾,易烊千玺,张译', director: '张艺谋' },
  { title: 'Parasite', original_title: '기생충', overview: '一个贫穷家庭巧妙地渗透到一个富裕家庭中，却引发了一系列意想不到的事件。', genres: 'drama,comedy', language: 'ko', region: 'KR', rating: 8.8, release_date: '2019-05-30', runtime: 132, cast: 'Song Kang-ho,Lee Sun-kyun,Cho Yeo-jeong', director: 'Bong Joon-ho' },
  { title: '千与千寻', original_title: 'Spirited Away', overview: '在搬家途中，小女孩千寻误入了一个神秘的灵异世界。', genres: 'animation,romance', language: 'ja', region: 'JP', rating: 9.4, release_date: '2001-07-20', runtime: 125, cast: '柊瑠美,入野自由,夏木真理', director: '宫崎骏' },
  { title: 'A Quiet Place', original_title: 'A Quiet Place', overview: '在一个被对声音极度敏感的生物所统治的世界中，一家人必须保持沉默才能生存。', genres: 'horror,scifi', language: 'en', region: 'US', rating: 7.5, release_date: '2018-04-06', runtime: 90, cast: 'Emily Blunt,John Krasinski,Millicent Simmonds', director: 'John Krasinski' },
  { title: '战狼2', original_title: 'Wolf Warrior 2', overview: '退伍军人冷锋被卷入非洲某国的叛乱，他孤身一人带领身陷战区的民众突围。', genres: 'action', language: 'zh', region: 'CN', rating: 7.1, release_date: '2017-07-27', runtime: 123, cast: '吴京,弗兰克·格里罗,吴刚', director: '吴京' },
  { title: 'La La Land', original_title: 'La La Land', overview: '一位爵士钢琴家和一名追梦的女演员在洛杉矶相遇并坠入爱河。', genres: 'romance,drama', language: 'en', region: 'US', rating: 8.3, release_date: '2016-12-09', runtime: 128, cast: 'Ryan Gosling,Emma Stone,John Legend', director: 'Damien Chazelle' },
  { title: '长津湖', original_title: 'The Battle at Lake Changjin', overview: '以抗美援朝战争中的长津湖战役为背景，讲述了志愿军连队的战斗故事。', genres: 'action,drama', language: 'zh', region: 'CN', rating: 7.4, release_date: '2021-09-30', runtime: 176, cast: '吴京,易烊千玺,段奕宏', director: '陈凯歌,徐克,林超贤' },
  { title: 'Blade Runner 2049', original_title: 'Blade Runner 2049', overview: '一名年轻的银翼杀手发现了一个被埋藏已久的秘密，可能将社会推入混乱。', genres: 'scifi,drama', language: 'en', region: 'US', rating: 8.0, release_date: '2017-10-06', runtime: 164, cast: 'Ryan Gosling,Harrison Ford,Ana de Armas', director: 'Denis Villeneuve' },
  { title: '你的名字。', original_title: 'Your Name.', overview: '两个从未谋面的少年少女，在梦中交换了身体。', genres: 'animation,romance', language: 'ja', region: 'JP', rating: 8.4, release_date: '2016-08-26', runtime: 106, cast: '神木隆之介,上白石萌音', director: '新海诚' },
  { title: 'The Grand Budapest Hotel', original_title: 'The Grand Budapest Hotel', overview: '一位传奇酒店门童与他年轻门生之间的冒险故事。', genres: 'comedy,drama', language: 'en', region: 'DE', rating: 8.1, release_date: '2014-03-28', runtime: 99, cast: 'Ralph Fiennes,F. Murray Abraham,Tony Revolori', director: 'Wes Anderson' },
]

export async function seedDatabase(): Promise<void> {
  const existingMusic = await db.prepare('SELECT COUNT(*) as count FROM music_tracks').get()
  if (existingMusic && Number(existingMusic.count) > 0) {
    console.log('[Seed] Database already has data, skipping seed')
    return
  }

  console.log('[Seed] Seeding database with demo data...')

  for (let i = 0; i < musicTracks.length; i++) {
    const track = musicTracks[i]
    const id = uuidv4()
    await db.prepare(`
      INSERT OR IGNORE INTO music_tracks (id, title, artist, album, cover_url, audio_url, download_url, duration, genre, language, year, play_count, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      track.title,
      track.artist,
      track.album,
      `https://picsum.photos/seed/music${i + 1}/300/300`,
      '',
      '',
      track.duration,
      track.genre,
      track.language,
      track.year,
      Math.floor(Math.random() * 50000),
      'seed',
      new Date().toISOString(),
      new Date().toISOString()
    )
  }

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i]
    const id = uuidv4()
    const result = await db.prepare(`
      INSERT OR IGNORE INTO movies (id, title, original_title, overview, poster_url, backdrop_url, rating, release_date, genres, language, region, runtime, cast, director, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      movie.title,
      movie.original_title,
      movie.overview,
      `https://picsum.photos/seed/movie${i + 1}/300/450`,
      `https://picsum.photos/seed/backdrop${i + 1}/1280/720`,
      movie.rating,
      movie.release_date,
      movie.genres,
      movie.language,
      movie.region,
      movie.runtime,
      movie.cast,
      movie.director,
      'seed',
      new Date().toISOString(),
      new Date().toISOString()
    )

    if (result.changes > 0) {
      const qualities = ['720p', '1080p', '4K']
      for (const quality of qualities) {
        const linkId = uuidv4()
        await db.prepare(`
          INSERT OR IGNORE INTO download_links (id, movie_id, quality, url, size)
          VALUES (?, ?, ?, ?, ?)
        `).run(linkId, id, quality, '', '')
      }
    }
  }

  console.log(`[Seed] Seeded ${musicTracks.length} music tracks and ${movies.length} movies`)
}

if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  ;(async () => {
    await initDatabase()
    await seedDatabase()
    console.log('[Seed] Done')
    process.exit(0)
  })()
}
