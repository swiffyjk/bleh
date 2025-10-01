//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import moment from 'moment';
import { handle_error_500 } from '../page';
import { log } from './log';
import { auth, auth_link, setRoot } from './page';
import { clamp_lit, clamp_sat, rgb_to_hsl } from './tools';
import ColorThief from 'color-thief-browser';
import { Settings } from 'luxon';

// loads your selected language in last.fm
export let lang = 'en';
// hello my name is stel :3
export let lang_info = {
    en: {
        name: 'English',
        by: ['clairedoll'],
        last_updated: 'latest'
    },
    de: {
        name: 'Deutsch',
        by: ['evangelicgirl', 'myraisounds', 'clairedoll'],
        last_updated: '2025-10-01'
    },
    pl: {
        name: 'Polski',
        by: ['iwas15with100k'],
        last_updated: '2024-06-17'
    },
    pt: {
        name: 'Português',
        by: ['ArthRMH', 'fr0r'],
        last_updated: '2025-08-10'
    },
    sv: {
        name: 'Svenska',
        by: ['Lrexie'],
        last_updated: '2025-09-30'
    }
};

export const trans = {
    page_templates: {
        type: {
            en: '{page} on {brand} {build}.{sku}',
            de: '{page} auf {brand} {build}.{sku}',
            pt: '{page} no {brand} {build}.{sku}',
            sv: '{page} på {brand} {build}.{sku}'
        },
        name_type: {
            en: '{name} - {page} on {brand} {build}.{sku}',
            de: '{name} - {page} auf {brand} {build}.{sku}',
            pt: '{name} - {page} no {brand} {build}.{sku}',
            sv: '{name} - {page} på {brand} {build}.{sku}'
        },
        name_sister_type: {
            en: '{name} by {sister} - {page} on {brand} {build}.{sku}',
            de: '{name} von {sister} - {page} auf {brand} {build}.{sku}',
            pt: '{name} por {sister} - {page} no {brand} {build}.{sku}',
            sv: '{name} av {sister} - {page} på {brand} {build}.{sku}'
        }
    },
    badges: {
        missing: {
            name: {
                en: 'No badges',
                de: 'Keine Abzeichen',
                pt: 'Sem emblemas',
                sv: 'Inga emblem'
            },
            reason: {
                en: 'Become a sponsor to get a badge!',
                de: 'Werde Sponsor, um ein Abzeichen zu erhalten!',
                pt: 'Se torne um apoiador para ganhar um emblema!',
                sv: 'Bli en sponsor för att få ett emblem!'
            }
        },
        'user-status-subscriber': {
            name: {
                en: 'Last.fm Pro'
            },
            reason: {
                en: 'Active Pro subscription',
                de: 'Aktives Pro-Abonnement',
                pt: 'Plano Pro ativo',
                sv: 'Aktiv Pro prenumeration'
            }
        },
        'user-status-staff': {
            name: {
                en: 'Staff',
                de: 'Mitarbeiter',
                pt: 'Equipe',
                sv: 'Personal'
            },
            reason: {
                en: 'Official member of Last.fm',
                de: 'Ofizielles Mitglied von Last.fm',
                pt: 'Membro oficial da Last.fm',
                sv: 'Officiell medlem på Last.fm'
            }
        },
        'user-status-mod': {
            name: {
                en: 'Mod',
                de: 'Moderator',
                pt: 'Moderador',
                sv: 'Moderator'
            },
            reason: {
                en: 'Official member of Last.fm',
                de: 'Ofizielles Mitglied von Last.fm',
                pt: 'Membro oficial do Last.fm',
                sv: 'Officiell medlem på Last.fm'
            }
        },
        'user-status-alum': {
            name: {
                en: 'Alum'
            },
            reason: {
                en: 'Former member of Last.fm',
                de: 'Ehemaliger Mitarbeiter von Last.fm',
                sv: 'Före-detta medlem på Last.fm'
            }
        },
        'label--fade': {
            reason: {
                en: 'They follow you!',
                de: 'Diese Person folgt dir!',
                pt: 'Ele(a) te segue!',
                sv: 'Denna medlem följer dig!'
            }
        },
        contributor: {
            name: {
                en: 'Contributor',
                de: 'Mitwirkender',
                pt: 'Contribuidor(a)',
                sv: 'Bidragsgivare'
            },
            reason: {
                en: 'Has worked on bleh or bwaa',
                de: 'Hat an bleh oder bwaa gearbeitet',
                pt: 'Trabalhou no bleh ou bwaa',
                sv: 'Har arbetat på bleh eller bwaa'
            }
        },
        translation: {
            name: {
                en: 'Translations',
                de: 'Übersetzungen',
                pt: 'Traduções',
                sv: 'Översättningar'
            }
        },
        cat: {
            name: {
                en: 'it’s a kitty!!',
                de: 'ein Kätzchen!!!',
                pt: 'é um gatinho!!',
                sv: 'en kissekatt!!'
            }
        },
        sponsor: {
            name: {
                en: 'Sponsor',
                de: 'Sponsor',
                pt: 'Apoiador',
                sv: 'Sponsor'
            },
            reason: {
                en: 'thank you from kate <3',
                de: 'danke von kate <3',
                pt: 'obrigadão da kate <3',
                sv: 'tack ifrån kate <3'
            }
        },
        cute: {
            reason: {
                en: 'Reserved',
                de: 'Exklusiv',
                pt: 'Reservado',
                sv: 'Exklusiv'
            }
        },
        reserved: {
            reason: {
                en: 'Reserved',
                de: 'Exklusiv',
                pt: 'Reservado',
                sv: 'Exklusiv'
            }
        },
        plaster: {
            name: {
                en: 'band-aid',
                de: 'pflaster'
            },
            reason: {
                en: 'the sillyness caught up to me',
                de: 'der unfug hat mich eingeholt'
            }
        },
        'bubble-tea': {
            name: {
                en: 'escoffier :3'
            },
            reason: {
                en: 'katelyn’s wife ~'
            }
        }
    },
    requires_higher_bleh_version: {
        en: 'Requires higher bleh version',
        de: 'Erfordert eine neuere bleh-Version',
        pt: 'Requer a versão mais recente do bleh',
        sv: 'Behöver en nyare version av bleh'
    },
    home: {
        en: 'Home',
        de: 'Startseite',
        pt: 'Início',
        sv: 'Startsida'
    },
    library: {
        en: 'Library',
        de: 'Bibliothek',
        ja: 'ライブラリ',
        pt: 'Biblioteca',
        sv: 'Bibliotek'
    },
    playlists: {
        en: 'Playlists',
        de: 'Playlists',
        sv: 'Spellistor'
    },
    view_profile: {
        en: 'View profile',
        de: 'Profil anzeigen',
        pt: 'Ver perfil',
        sv: 'Visa profil'
    },
    shouts: {
        en: 'Shouts',
        de: 'Shouts',
        pt: 'Mensagens',
        ja: 'シャウト',
        sv: 'Hojtningar'
    },
    cant_shout: {
        en: 'You cannot leave shouts here',
        de: 'Du kannst hier keine Shouts hinterlassen',
        sv: 'Du kan inte hojta här'
    },
    failed_to_send: {
        en: 'Failed to send',
        de: 'Senden fehlgeschlagen',
        pt: 'Falha ao enviar',
        sv: 'Gick inte att skicka'
    },
    sent: {
        en: 'Sent',
        de: 'Gesendet',
        pt: 'Enviado',
        sv: 'Skickat'
    },
    single_shout: {
        en: 'viewing a single shout',
        pt: 'vendo uma mensagem',
        sv: 'visar en enda hojtning'
    },
    about: {
        en: 'About',
        de: 'Über',
        pt: 'Sobre',
        sv: 'Om'
    },
    no_about: {
        en: '{u} is keeping quiet',
        de: '{u} ist wohl etwas schweigsam',
        pt: '{u} está bem quietinho',
        sv: '{u} håller sig tyst'
    },
    edit_wiki: {
        en: 'Edit wiki',
        de: 'Wiki bearbeiten',
        pt: 'Editar wiki',
        sv: 'Redigera wiki'
    },
    read_more: {
        en: 'Read more',
        de: 'Mehr anzeigen',
        pt: 'Ler mais',
        ja: 'もっと読む',
        sv: 'Läs mer'
    },
    refresh: {
        en: 'Refresh',
        de: 'Aktualisieren',
        pt: 'Atualizar',
        sv: 'Ladda om'
    },
    refreshed: {
        en: 'Refreshed',
        de: 'Aktualisiert',
        pt: 'Atualizado',
        sv: 'Laddats om'
    },
    refresh_tracks: {
        en: 'Refresh tracks',
        de: 'Titel aktualisieren',
        pt: 'Atualizar faixas',
        sv: 'Ladda om låtar'
    },
    unavailable: {
        en: 'Unavailable',
        de: 'Nicht verfügbar',
        pt: 'Indisponível',
        sv: 'Otillgänglig'
    },
    set_obsession: {
        en: 'Obsess',
        de: 'Obsessen',
        pt: 'Obsessão',
        sv: 'Besatthet'
    },
    obsession_first: {
        en: 'First to claim this obsession!',
        de: 'Die erste Person, die sich diese Obsession für sich beansprucht!',
        pt: 'Primeiro a ter esta obsessão!',
        sv: 'Den första personen att bli besatt av denna!'
    },
    compare: {
        en: 'Compare',
        de: 'Vergleichen',
        pt: 'Comparar',
        sv: 'Jämför'
    },
    compare_plays: {
        en: 'Compare plays',
        de: 'Plays vergleichen',
        pt: 'Comparar reproduções',
        sv: 'Jämför spelningar'
    },
    inverse_compare: {
        name: {
            en: 'Inverse comparison method',
            de: 'Umgekehrte Vergleichsmethode',
            sv: 'Invertera jämförelse'
        },
        body: {
            en: 'Show items you do not share instead',
            de: 'Zeige stattdessen Objekte, die ihr nicht teilt',
            sv: 'Visa istället objekt ni inte delar alls'
        }
    },
    one_page: {
        en: '1 page',
        de: '1 Seite',
        pt: '1 página',
        sv: '1 sida'
    },
    count_pages: {
        en: '{c} pages',
        de: '{c} Seiten',
        pt: '{c} páginas',
        sv: '{c} sidor'
    },
    gathering_plays_for_user_pages: {
        en: 'Gathering plays for {u} ({current_page}/{pages})',
        de: 'Sammle Plays für {u} ({current_page}/{pages})',
        pt: 'Reunindo reproduções para {u} ({current_page}/{pages})',
        sv: 'Samlar spelningar av {u} ({current_page}/{pages})'
    },
    nothing_in_common: {
        en: 'Nothing in common (๑-﹏-๑)',
        de: 'Nichts gemeinsam (๑-﹏-๑)',
        pt: 'Nada em comum (๑-﹏-๑)',
        sv: 'Inget gemensamt (๑-﹏-๑)'
    },
    others_featured: {
        en: 'Others featured',
        de: 'Andere gefeatured',
        pt: 'Outros em destaque',
        sv: 'Gästartister'
    },
    your_scrobbles: {
        en: 'Your scrobbles',
        de: 'Deine Scrobbles',
        pt: 'Seus scrobbles',
        sv: 'Dina skrobblingar'
    },
    play: {
        en: 'Play',
        de: 'Abspielen',
        sv: 'Spela upp'
    },
    plays: {
        en: 'Plays',
        de: 'Plays',
        pt: 'Reproduções',
        sv: 'Spelningar'
    },
    try_again: {
        en: 'Try again',
        de: 'Erneut versuchen',
        pt: 'Tentar novamente',
        sv: 'Försök igen'
    },
    back: {
        en: 'Back',
        de: 'Zurück',
        pt: 'Voltar',
        sv: 'Tillbaks'
    },
    settings: {
        en: 'Settings',
        de: 'Einstellungen',
        pt: 'Configurações',
        ja: '設定',
        sv: 'Inställningar'
    },
    on_ignore_list: {
        en: 'Ignored',
        de: 'Ignoriert',
        pt: 'Ignorados',
        sv: 'Ignorerad'
    },
    friends: {
        en: 'Friends',
        de: 'Freunde',
        pt: 'Amigos',
        sv: 'Vänner'
    },
    friends_setting: {
        en: 'Keep up to date on what your friends are listening to',
        de: 'Bleibe auf dem Laufenden, was deine Freunde hören',
        sv: 'Håll koll på vad dina vänner lyssnar på'
    },
    add_friends: {
        en: 'Add friends',
        de: 'Freunde hinzufügen',
        sv: 'Lägg till vänner'
    },
    starred_friend: {
        name: {
            en: 'Starred friend',
            de: 'Markierter Freund',
            sv: 'Stjärnmärkt vän'
        },
        body: {
            en: 'View their scrobbles alongside yours at all times',
            de: 'Sehe deren Scrobbles jederzeit neben deinen an',
            pt: 'Veja os scrobbles dele(a) junto aos seus o tempo todo',
            sv: 'Se deras skrobblingar bredvid dina hela tiden'
        },
        notice: {
            en: 'Not seeing the options you’re after? Fill out your friends list in the settings.',
            de: 'Siehst du nicht die Optionen, die du suchst? Fülle deine Freundesliste in den Einstellungen aus.',
            sv: 'Ser du inte inställningar du letar efter? Fyll upp din vänlista i inställningarna.'
        }
    },
    friend_difference: {
        en: '‘Friends’ is a bleh-exclusive feature that allows you to keep up to date on your friend’s listening history, it is local and does not influence your following list.',
        de: '„Freunde“ ist eine exklusive bleh-Funktion, mit der du auf dem Laufenden bleiben kannst, was deine Freunde hören. Freunde werden lokal verwaltet und beeinflussen nicht deine Follower-Liste.',
        sv: '’Vänner’ är en exklusiv del av bleh som tillåter dig att hålla koll på dina vänners lyssnarhistoria, det hanteras lokalt och rör inte din följarlista.'
    },
    add_as_friend: {
        en: 'Add as friend',
        de: 'Als Freund hinzufügen',
        sv: 'Lägg till som vän'
    },
    remove_friend: {
        name: {
            en: 'Remove friend',
            de: 'Freund entfernen',
            sv: 'Ta bort vän'
        },
        body: {
            en: 'Are you sure you want to remove {u} as a friend, you will stay following them - it‘s only local.',
            de: 'Bist du sicher, dass du {u} als Freund entfernen möchtest? Du folgst der Person weiterhin - die Freundesliste wird lokal verwaltet.',
            sv: 'Är du säker på att du vill ta bort {u} som vän? Du följer dem fortfarande - vänlistan hanteras lokalt.'
        }
    },
    added_as_friend: {
        en: 'Added friend',
        de: 'Freund hinzugefügt',
        sv: 'Lagt till som vän'
    },
    removed_friend: {
        en: 'Removed friend',
        de: 'Freund entfernt',
        sv: 'Tagit bort vän'
    },
    added_star: {
        en: 'Added star status',
        de: 'Markiert',
        sv: 'Stjärnmärkte'
    },
    add_as_starred_friend: {
        en: 'Star friend',
        de: 'Freund markieren',
        sv: 'Stjärnmärk vän'
    },
    removed_star: {
        en: 'Removed star status',
        de: 'Markierung entfernt',
        sv: 'Tog bort stjärnmärke'
    },
    remove_as_star_friend: {
        en: 'Remove star status',
        de: 'Markierung entfernen',
        sv: 'Ta bort stjärnmärke'
    },
    aka: {
        en: 'aka.',
        de: 'alias',
        pt: 'vulgo',
        sv: 'också känd som'
    },
    account_pronouns: {
        en: 'pronouns',
        de: 'pronomen',
        pt: 'pronomes',
        sv: 'pronomen'
    },
    account_created: {
        // dont translate to "scrobbling since", instead just "created"
        en: 'created',
        de: 'erstellt',
        pt: 'criada',
        sv: 'skapades'
    },
    account_scrobbling_since_replace: {
        // copy this from last.fm 1:1 (including the space at the end if there)
        en: 'scrobbling since ',
        de: 'scrobbelt seit ',
        pt: 'em scrobble desde ',
        ja: 'よりscrobble',
        sv: 'skrobblar sedan '
    },
    edit: {
        en: 'Edit',
        de: 'Bearbeiten',
        pt: 'Editar',
        sv: 'Redigera'
    },
    bulk_edit: {
        // as in the last.fm 'Bulk Edit' open-source extension
        en: 'Bulk edit',
        de: 'Mehrere bearbeiten',
        pt: 'Edição em massa',
        sv: 'Bulkredigera'
    },
    edit_profile: {
        en: 'Edit profile',
        de: 'Profil bearbeiten',
        pt: 'Editar perfil',
        sv: 'Redigera profil'
    },
    scrobble: {
        en: 'Scrobble',
        de: 'Scrobble',
        sv: 'Skrobbla'
    },
    scrobbles: {
        en: 'Scrobbles',
        de: 'Scrobbles',
        ja: 'Scrobble',
        sv: 'Skrobblingar'
    },
    count_scrobbles: {
        en: '{c} scrobbles',
        de: '{c} Scrobbles',
        pt: '{c} scrobbles',
        sv: '{c} skrobblingar'
    },
    new_scrobble: {
        en: 'New scrobble',
        de: 'Neuer Scrobble',
        pt: 'Novo scrobble',
        sv: 'Ny skrobbel'
    },
    scrobble_failed: {
        en: 'Scrobble could not be sent',
        de: 'Scrobble konnte nicht gesendet werden',
        sv: 'Skrobblingen kunde inte skickas'
    },
    scrobble_error_codes: {
        // https://www.last.fm/api/show/track.scrobble
        1: {
            en: 'Artist name was ignored',
            de: 'Künstlername wurde ignoriert',
            sv: 'Artistnamnet var ignorerad'
        },
        2: {
            en: 'Track name was ignored',
            de: 'Titelname wurde ignoriert',
            sv: 'Låttiteln var ignorerad'
        },
        3: {
            en: 'Timestamp is too old',
            de: 'Zeitstempel ist zu alt',
            sv: 'Tidsstämpeln är för gammal'
        },
        4: {
            en: 'Timestamp is too new',
            de: 'Zeitstempel ist zu neu',
            sv: 'Tidsstämpeln är för ny'
        },
        5: {
            en: 'Daily scrobble limit exceeded',
            sv: 'Max dagliga skrobblingar har nåtts'
        }
    },
    artist: {
        en: 'Artist',
        de: 'Künstler',
        pt: 'Artista',
        sv: 'Artist'
    },
    artists: {
        en: 'Artists',
        de: 'Künstler',
        pt: 'Artistas',
        ja: 'アーティスト',
        sv: 'Artister'
    },
    artists_tooltip: {
        en: 'Multiple artists are grouped into this profile',
        de: 'Mehrere Künstler sind auf diesem Profil gruppiert',
        pt: 'Múltiplos artistas estão agrupados neste perfil',
        sv: 'Flera artister delar denna profil'
    },
    album: {
        en: 'Album',
        de: 'Album',
        pt: 'Álbum',
        sv: 'Album'
    },
    albums: {
        en: 'Albums',
        de: 'Alben',
        pt: 'Álbuns',
        ja: 'アルバム',
        sv: 'Album'
    },
    album_artist: {
        en: 'Album Artist',
        de: 'Albumkünstler',
        sv: 'Albumartist'
    },
    track: {
        en: 'Track',
        de: 'Titel',
        pt: 'Faixa',
        sv: 'Låt'
    },
    tracks: {
        en: 'Tracks',
        de: 'Titel',
        pt: 'Faixas',
        ja: 'トラック',
        sv: 'Låtar'
    },
    appearance: {
        en: 'Appearance',
        de: 'Erscheinungsbild',
        pt: 'Aparência',
        sv: 'Utséende'
    },
    visual: {
        en: 'Visual',
        de: 'Design',
        sv: 'Visuellt'
    },
    theme: {
        en: 'Theme',
        de: 'Farbschema',
        pt: 'Tema',
        sv: 'Tema'
    },
    theme_day: {
        name: {
            en: 'Day',
            de: 'Tag',
            sv: 'Dag'
        },
        body: {
            en: 'When your system reports light theme',
            de: 'Wenn dein System ein helles Farbschema hat',
            sv: 'När ditt system rapporterar ett ljust tema'
        }
    },
    theme_night: {
        name: {
            en: 'Night',
            de: 'Nacht',
            sv: 'Natt'
        },
        body: {
            en: 'When your system reports dark theme',
            de: 'Wenn dein System ein dunkles Farbschema hat',
            sv: 'När ditt system rapporterar ett mörk tema'
        }
    },
    theme_schedule: {
        en: 'Choose which theme preference to apply based on your system theme.',
        de: 'Wähle dein bevorzugtes Farbschema basierend auf deinem Systemdesign.',
        sv: 'Välj föredraget tema att tillämpa utgående från ditt systemtema.'
    },
    themes: {
        name: {
            en: 'Themes',
            de: 'Farbschema',
            pt: 'Temas',
            sv: 'Teman'
        },
        light: {
            en: 'Light',
            de: 'Hell',
            pt: 'Claro',
            sv: 'Ljus'
        },
        ink: {
            en: 'Ink',
            de: 'Tinte',
            pt: 'Tinta',
            sv: 'Bläck'
        },
        dark: {
            en: 'Ash',
            de: 'Asche',
            pt: 'Cinza',
            sv: 'Aska'
        },
        darker: {
            en: 'Dark',
            de: 'Dunkel',
            pt: 'Escuro',
            sv: 'Mörk'
        },
        oled: {
            en: 'Void',
            de: 'Nacht',
            pt: 'Vazio',
            sv: 'Tomhet'
        }
    },
    colours: {
        en: 'Colours',
        de: 'Farben',
        pt: 'Colorir',
        sv: 'Färger'
    },
    change_my_colour_when: {
        name: {
            en: 'Use a context-based accent colour when',
            de: 'Kontextbasierte Akzentfarbe verwenden, wenn',
            sv: 'Använd kontextbaserad accentfärg när'
        },
        body: {
            en: 'Temporarily override your selected accent to match album art',
            de: 'Überschreibe vorübergehend deine ausgewählte Akzentfarbe, damit sie zum Albumcover passt',
            sv: 'Ändra tillfälligt din valda accentfärg för att matcha albumkonsten'
        }
    },
    adaptive: {
        en: 'Adaptive',
        de: 'Adaptiv',
        sv: 'Adaptiv'
    },
    adaptive_tip: {
        en: 'Your theme preference will be either {day} or {night}, based on your system. ',
        de: 'Dein bevorzugtes Farbschema wird entweder {day} oder {night} sein, basierend auf deinem System. ',
        sv: 'Ditt föredragna tema blir antigen {day} eller {night}, beroende på ditt system. '
    },
    change_schedule: {
        en: 'Change schedule',
        de: 'Zeitplan ändern',
        sv: 'Ändra schema'
    },
    hue_from_album: {
        en: 'Browsing album pages',
        de: 'Albumseiten angesehen werden',
        sv: 'Du är på albumsidor'
    },
    colourful_active: {
        en: 'Actively scrobbling a track',
        de: 'ein Titel aktiv gescrobbelt wird',
        sv: 'Aktivt skrobblar en låt'
    },
    colourful_all: {
        en: 'Viewing any track',
        de: 'ein beliebiger Titel angesehen wird',
        sv: 'Visar en låt'
    },
    configure: {
        en: 'Configure',
        de: 'Konfigurieren',
        pt: 'Configurar',
        sv: 'Konfigurera'
    },
    links: {
        en: 'Links',
        de: 'Links',
        sv: 'Länkar'
    },
    event: {
        en: 'Event',
        de: 'Event',
        pt: 'Evento',
        sv: 'Evenemang'
    },
    events: {
        en: 'Events',
        de: 'Events',
        pt: 'Eventos',
        ja: 'イベント',
        sv: 'Evenemang'
    },
    lineup: {
        en: 'Line-up',
        de: 'Line-up',
        pt: 'Programação',
        sv: 'Spelschema'
    },
    attendance: {
        en: 'Attendance',
        de: 'Teilnahme',
        pt: 'Comparecimento',
        sv: 'Närvarande'
    },
    top_badge: {
        en: 'Top Badge',
        de: 'Top-Abzeichen',
        pt: 'Emblema superior',
        sv: 'Toppemblem'
    },
    general: {
        en: 'General',
        de: 'Allgemein',
        pt: 'Geral',
        sv: 'Generellt'
    },
    interface: {
        en: 'Interface',
        de: 'Oberfläche',
        sv: 'Interface'
    },
    music: {
        en: 'Music',
        de: 'Musik',
        pt: 'Música',
        ja: '音楽',
        sv: 'Musik'
    },
    playback: {
        en: 'Playback',
        de: 'Wiedergabe',
        sv: 'Uppspelning'
    },
    profile: {
        en: 'Profile',
        de: 'Profil',
        pt: 'Perfil',
        pl: 'Profil',
        sv: 'Profil'
    },
    current_season: {
        en: 'Current season',
        de: 'Aktuelle Saison',
        pt: 'Estação atual',
        sv: 'Nuvarande årstid'
    },
    seasonal: {
        name: {
            // translate to 'Seasons' if it reads better
            en: 'Seasonal',
            de: 'Saisonal',
            pt: 'Estações',
            sv: 'Årstider'
        },
        listing: {
            none: {
                en: 'None active',
                de: 'Keine aktiv',
                pt: 'Nenhuma ativa',
                sv: 'Ingen aktiv'
            },
            easter: {
                en: 'Easter',
                de: 'Ostern',
                pt: 'Páscoa',
                sv: 'Påsk'
            },
            pride: {
                en: 'Pride',
                de: 'Pride',
                pt: 'Orgulho',
                sv: 'Pride'
            },
            halloween: {
                en: 'Halloween',
                de: 'Halloween',
                pt: 'Dia das Bruxas',
                sv: 'Halloween'
            },
            pre_fall: {
                en: 'Early autumn',
                de: 'Früher Herbst',
                pt: 'Pré-outono',
                sv: 'Tidig höst'
            },
            fall: {
                en: 'Autumn',
                de: 'Herbst',
                pt: 'Outono',
                sv: 'Höst'
            },
            christmas: {
                en: 'Christmas',
                de: 'Weihnachten',
                pt: 'Natal',
                sv: 'Jul'
            },
            new_years: {
                en: 'New Years',
                de: 'Neujahr',
                pt: 'Ano Novo',
                sv: 'Nyår'
            }
        }
    },
    new_season: {
        en: 'New Season!',
        de: 'Neue Jahreszeit!',
        pt: 'Nova Estação!',
        sv: 'Ny årstid!'
    },
    value_for_time: {
        en: '{v} for {time}',
        pt: '{v} para {time}',
        sv: '{v} till {time}'
    },
    seasonal_timeline: {
        en: 'Seasonal timeline',
        de: 'Saisonaler Zeitstrahl',
        pt: 'Linha do tempo sazonal',
        sv: 'Tidslinje för årstider'
    },
    enable_seasons: {
        name: {
            en: 'Automatically adapt to seasonal events',
            de: 'Automatisch an saisonale Events anpassen',
            pt: 'Adaptar automaticamente a eventos sazonais',
            sv: 'Adaptera automatiskt för årstider'
        },
        body: {
            en: 'Adapts the default colour, iconset, and shows particles depending on the season',
            de: 'Passt die Standardfarbe und das Iconset an und zeigt Partikel entsprechend der Jahreszeit an',
            pt: 'Adapta a cor padrão, ícones e exibe partículas dependendo da sazonalidade',
            sv: 'Adaptera färg, ikoner, och visa partiklar beroende på årstiden'
        }
    },
    seasonal_particles_fps: {
        name: {
            en: 'Reduce quality of particles',
            de: 'Partikelqualität reduzieren',
            sv: 'Sänk partiklarnas kvalitet'
        },
        body: {
            en: 'Snow particles use a drop-shadow glow for aesthetics with the added processing cost',
            de: 'Schneepartikel verwenden für die Ästhetik einen Glanzeffekt – erfordert zusätzliche Rechenleistung',
            sv: 'Snöpartiklarna använder en glödeffekt för estetiska själ, med lite extra datorbelastning'
        }
    },
    seasonal_offset: {
        en: 'Seasonal events are ran in your timezone, which we calculated as {offset}',
        de: 'Saisonale Events werden in deiner Zeitzone ausgeführt, die wir als {offset} berechnet haben',
        pt: 'Eventos sazonais são realizados em seu fuso horário, que calculamos como {offset}',
        sv: 'Årstidsevenemang hålls i din tidszon, som vi räknade ut vara {offset}'
    },
    calculated_offset: {
        // timezone offset
        en: 'Calculated offset based on timezone',
        de: 'Berechnete Verschiebung basierend auf der Zeitzone',
        pt: 'Offset calculado com base no fuso horário',
        sv: 'Förskjutning kalkylerats från tidszon'
    },
    started: {
        // eg. season started 1 day ago
        en: 'Started',
        de: 'Gestartet',
        pt: 'Começou',
        sv: 'Har börjat'
    },
    next_in: {
        // eg. next season in 5 days
        en: 'Next in',
        de: 'Nächste in',
        pt: 'Próximo em',
        sv: 'Nästa om'
    },
    ends_in: {
        // eg. season ends in 3 days
        en: 'Ends in',
        de: 'Endet in',
        pt: 'Termina em',
        sv: 'Slutar om'
    },
    text: {
        en: 'Text',
        de: 'Text',
        pt: 'Texto',
        sv: 'Text'
    },
    accessibility: {
        en: 'Accessibility',
        de: 'Barrierefreiheit',
        pt: 'Acessibilidade',
        sv: 'Tillgängligthet'
    },
    troubleshooting: {
        en: 'Advanced',
        de: 'Fortgeschritten',
        pt: 'Avançado',
        sv: 'Advancerat'
    },
    recommendations: {
        en: 'Suggested',
        de: 'Empfohlen',
        pt: 'Sugestões',
        sv: 'Förslag'
    },
    releases: {
        en: 'Releases',
        de: 'Veröffentlichungen',
        pt: 'Lançamentos',
        sv: 'Skivsläpp'
    },
    bookmarks: {
        en: 'Bookmarks',
        de: 'Lesezeichen',
        pt: 'Marcadores',
        ja: 'ブックマーク',
        sv: 'Bokmärken'
    },
    charts: {
        en: 'Charts',
        de: 'Charts',
        pt: 'Paradas',
        ja: 'チャート',
        sv: 'Topplistor'
    },
    welcome_back_user: {
        en: 'Welcome back {user}!',
        de: 'Willkommen züruck, {user}!',
        pt: 'Bem-vindo(a) {user}!',
        sv: 'Välkommen tillbaka, {user}!'
    },
    // TODO(stel): is my capitalisation correct here at all lol ; yes cutie, well done <3
    good_morning_user: {
        en: 'Good morning, {user}',
        de: 'Guten Morgen, {user}',
        pt: 'Bom dia, {user}',
        sv: 'God morgon, {user}'
    },
    good_afternoon_user: {
        en: 'Good afternoon, {user}',
        de: 'Guten Nachmittag, {user}',
        pt: 'Boa tarde, {user}',
        sv: 'God eftermiddag, {user}'
    },
    good_evening_user: {
        en: 'Good evening, {user}',
        de: 'Guten Abend, {user}',
        pt: 'Boa noite, {user}',
        sv: 'God kväll, {user}'
    },
    good_night_user: {
        en: 'Goodnight, {user}',
        de: 'Gute Nacht, {user}',
        pt: 'Boa noite, {user}',
        sv: 'God natt, {user}'
    },
    bleh_settings: {
        en: 'bleh Settings',
        de: 'bleh-Einstellungen',
        pt: 'Configurações do bleh',
        sv: 'bleh-inställningar'
    },
    bleh_setup: {
        en: 'Setup',
        de: 'Einrichtung',
        pt: 'Instalação',
        sv: 'Installation'
    },
    import: {
        en: 'Import',
        de: 'Importieren',
        pt: 'Importar',
        pl: 'Importuj',
        sv: 'Importera'
    },
    import_settings: {
        en: 'Import settings',
        de: 'Einstellungen importieren',
        pt: 'Importar configurações',
        sv: 'Importera inställningar'
    },
    import_notice: {
        en: 'This is a permanent action, beware of where you are copying from',
        de: 'Dieser Vorgang ist unwiderruflich – sei vorsichtig, von wo du kopierst',
        pt: 'Esta é uma ação permanente, cuidado com o lugar de onde você está copiando',
        sv: 'Det här är permanent, oberoende av vart du kopierar ifrån'
    },
    export: {
        en: 'Export',
        de: 'Exportieren',
        pt: 'Exportar',
        pl: 'Eksportuj',
        sv: 'Exportera'
    },
    export_settings: {
        en: 'Export settings',
        de: 'Einstellungen exportieren',
        pt: 'Exportar configurações',
        sv: 'Exportera inställningar'
    },
    reset: {
        en: 'Reset',
        de: 'Zurücksetzen',
        pt: 'Restaurar',
        pl: 'Resetuj',
        sv: 'Återställ'
    },
    reset_settings: {
        en: 'Reset settings to default',
        de: 'Standardeinstellungen wiederherstellen',
        pt: 'Restaurar as configurações para o padrão',
        sv: 'Återställ alla inställningar till det vanliga'
    },
    reset_notice: {
        en: 'Your settings will be permanently reset, are you sure?',
        de: 'Deine Einstellungen werden unwiderruflich zurückgesetzt, bist du sicher?',
        pt: 'Sua configuração vai ser permanentemente restaurada ao padrão, você tem certeza?',
        sv: 'Är du säker på att du vill återställa alla inställningar? Det är permanent.'
    },
    reset_item_to_default: {
        en: 'Reset item to default',
        de: 'Element auf Standard zurücksetzen',
        pt: 'Restaurar itens para o padrão',
        sv: 'Återställ till standard'
    },
    make_a_backup: {
        en: 'Make a backup',
        de: 'Backup erstellen',
        pt: 'Faça um backup',
        sv: 'Skapa en backup'
    },
    news: {
        en: 'News',
        de: 'Neuigkeiten',
        pt: 'Notícias',
        sv: 'Nytt'
    },
    news_from_user: {
        en: 'News from {user}',
        de: 'Neuigkeiten von {user}',
        pt: 'Notícias da {user}',
        sv: 'Nytt från {user}'
    },
    default: {
        en: 'Default',
        de: 'Standard',
        pt: 'Padrão',
        sv: 'Standard'
    },
    avatar: {
        en: 'Avatar',
        de: 'Profilbild',
        sv: 'Profilbild'
    },
    customise: {
        en: 'Customise',
        de: 'Anpassen',
        pt: 'Customizar',
        sv: 'Anpassa'
    },
    convert: {
        en: 'Convert',
        de: 'Umwandeln',
        pt: 'Converter',
        sv: 'Konvertera'
    },
    convert_from_hex: {
        en: 'Convert colour',
        de: 'Farbe umwandeln',
        pt: 'Converter cor',
        sv: 'Konvertera färg'
    },
    fonts: {
        en: 'Fonts',
        de: 'Schriftart',
        pt: 'Fontes',
        sv: 'Typsnitt'
    },
    hue: {
        en: 'Accent colour',
        de: 'Akzentfarbe',
        pt: 'Cor de destaque',
        pl: 'Kolor akcentu (hue)',
        sv: 'Accentfärg'
    },
    sat: {
        en: 'Vibrancy',
        de: 'Sättigung',
        pt: 'Vivacidade',
        pl: 'Nasycenie (saturation)',
        sv: 'Färgmättnad'
    },
    lit: {
        en: 'Lightness',
        de: 'Helligkeit',
        pt: 'Claridade',
        pl: 'Jasność (lightness)',
        sv: 'Ljushet'
    },
    solarium: {
        name: {
            en: 'Enable solarium glass effects',
            de: 'Solarium-Glaseffekte aktivieren',
            sv: 'Aktivera solariumsglaseffekter'
        },
        body: {
            en: 'Apply a see-through glassy material to many surfaces, which may degrade performance on some devices',
            de: 'Fügt vielen Oberflächen ein durchsichtiges, glasartiges Material hinzu – kann die Leistung auf einigen Geräten beeinträchtigen',
            sv: 'Läg till ett genomskinligt glasliknande material till många ytor, som kan degradera prestanda på vissa enheter'
        }
    },
    seasonal_warning: {
        en: 'This season has a custom default accent colour!',
        de: 'Diese Saison hat eine benutzerdefinierte Akzentfarbe',
        pt: 'Esta estação tem uma cor de destaque personalizada!',
        sv: 'Denna årstid har en anpassad färg!'
    },
    card_background_saturation: {
        name: {
            en: 'Card background vibrancy',
            de: 'Sättigung des Kartenhintergrunds',
            pt: 'Vivacidade de fundo do cartão',
            sv: 'Bakgrundsfärg'
        },
        body: {
            en: 'Bring some colour into your world (or reduce it)',
            de: 'Bringe etwas Farbe in deine Welt (oder reduziere sie)',
            pt: 'Traz algumas cores ao mundo (ou diminui elas)',
            sv: 'Skaffa lite färg i din värld (eller minska den)'
        }
    },
    save: {
        en: 'Save',
        de: 'Speichern',
        pt: 'Salvar',
        pl: 'Zapisz',
        sv: 'Spara'
    },
    cancel: {
        en: 'Cancel',
        de: 'Abbrechen',
        pt: 'Cancelar',
        pl: 'Anuluj',
        sv: 'Avbryt'
    },
    add: {
        en: 'Add',
        de: 'Hinzufügen',
        pt: 'Adicionar',
        sv: 'Lägg till'
    },
    remove: {
        en: 'Remove',
        de: 'Entfernen',
        pt: 'Remover',
        sv: 'Radera'
    },
    clear: {
        en: 'Clear',
        de: 'Löschen',
        pt: 'Limpar',
        pl: 'Wyczyść',
        sv: 'Rensa'
    },
    close: {
        en: 'Close',
        de: 'Schließen',
        pt: 'Fechar',
        pl: 'Zamknij',
        sv: 'Stäng'
    },
    go: {
        en: 'Go',
        de: 'Los',
        pt: 'Ir',
        sv: 'Gå'
    },
    skip: {
        en: 'Skip',
        de: 'Überspringen',
        pt: 'Pular',
        sv: 'Hoppa över'
    },
    send: {
        en: 'Send',
        de: 'Senden',
        pt: 'Enviar',
        sv: 'Skicka'
    },
    send_quickly_with: {
        en: 'Send quickly with {kbd}',
        de: 'Schnell senden mit {kbd}',
        pt: 'Enviar rapidamente com {kbd}',
        sv: 'Skicka snabbt med {kbd}'
    },
    done: {
        en: 'Done',
        de: 'Fertig',
        pt: 'Feito',
        pl: 'Gotowe',
        sv: 'Färdig'
    },
    finish: {
        en: 'Finish',
        de: 'Beenden',
        pt: 'Terminar',
        sv: 'Klart'
    },
    continue: {
        en: 'Continue',
        de: 'Fortsetzen',
        pt: 'Continuar',
        pl: 'Kontynuuj',
        sv: 'Fortsätt'
    },
    click_for_more_options: {
        en: 'Click for more options',
        de: 'Klicke für weitere Optionen',
        sv: 'Tryck för mer alternativ'
    },
    right_click_for_more_options: {
        en: 'Right click for more options',
        de: 'Rechtsklick für weitere Optionen',
        pt: 'Clique esquerdo para mais opções',
        sv: 'Högerklicka för mer alternativ'
    },
    refresh_pending: {
        name: {
            en: 'Refresh pending',
            de: 'Aktualisierung anstehend',
            pt: 'Atualizar pendências',
            sv: 'Förväntar omladdning'
        },
        body: {
            en: 'A setting you changed requires a page refresh',
            de: 'Eine von dir geänderte Einstellung erfordert eine Seitenaktualisierung, damit sie wirksam wird',
            pt: 'Uma configuração que você mudou exige uma atualização de página',
            sv: 'En inställning du ändrade på behöver at sidan laddas om'
        }
    },
    new: {
        en: 'New',
        de: 'Neu',
        pt: 'Nova',
        sv: 'Ny'
    },
    beta: {
        en: 'Beta',
        de: 'Beta',
        sv: 'Beta'
    },
    more: {
        en: 'More',
        de: 'Mehr',
        pt: 'Mais',
        sv: 'Mer'
    },
    inbox: {
        en: 'Inbox',
        de: 'Posteingang',
        pt: 'Caixa de entrada',
        sv: 'Brevlåda'
    },
    notifications: {
        en: 'Notifications',
        de: 'Benachrichtigungen',
        pt: 'Notificações',
        sv: 'Notiser'
    },
    messages: {
        en: 'Messages',
        de: 'Nachrichten',
        pt: 'Mensagens',
        sv: 'Meddelanden'
    },
    preview: {
        en: 'Preview',
        de: 'Vorschau',
        sv: 'Förhandsvisning'
    },
    about_me_preview: {
        // About Me
        en: 'About (preview)',
        de: 'Über (Vorschau)',
        pt: 'Sobre (preview)',
        sv: 'Om (förhandsvisning)'
    },
    markdown_tip: {
        // use <br><br> to add a space between the first sentence and the next
        // keep the alt text as "banner", english and lowercase as thats how its detected rn
        // may change in the future
        en: 'You can use line breaks, bold text, italics, underlines, images, and headers visible to other bleh users.<br><br>Images are created via ![alt text](link). Changing the alt text to "banner" applies a profile banner.',
        de: 'Du kannst Zeilenumbrüche, Fettdruck, Kursivschrift, Unterstreichungen, Bilder und Überschriften verwenden, die für andere bleh-Benutzer sichtbar sind.<br><br>Bilder werden mit ![Alt-Text](Link) eingefügt. Wenn du den Alt-Text in „banner“ änderst, wird ein Profilbanner angewendet.',
        pt: 'Você pode usar quebras de linha, texto em negrito, itálico, sublinhado, imagens e cabeçalhos visíveis para outros usuários do bleh.<br><br>As imagens são criadas usando ![alt text](link). Alterar o alt text para "banner" aplica um banner no perfil.',
        sv: 'Du kan använda radbrytningar, fetstilt text, kursiv, understrykt, bilder, och rubriker som syns av andra bleh-användare.<br><br>Bilder skapas via ![alt text](link). Ändras alt text till "banner" så tillämpas en banner på din profil.'
    },
    find_on: {
        en: 'Find on',
        de: 'Hier zu finden',
        pt: 'Encontre em',
        sv: 'Sök upp på'
    },
    following: {
        en: 'Following',
        de: 'Gefolgt',
        pt: 'Seguindo',
        sv: 'Följer'
    },
    followers: {
        en: 'Followers',
        de: 'Follower:innen',
        pt: 'Seguidores',
        sv: 'Följare'
    },
    neighbours: {
        en: 'Neighbours',
        de: 'Nachbarn',
        pt: 'Vizinhos',
        sv: 'Grannar'
    },
    website: {
        en: 'Website',
        de: 'Webseite',
        sv: 'Hemsida'
    },
    overview: {
        en: 'Overview',
        de: 'Übersicht',
        pt: 'Visão geral',
        ja: 'ダイジェスト',
        sv: 'Översikt'
    },
    photos: {
        en: 'Photos',
        de: 'Fotos',
        pt: 'Fotos',
        ja: '写真',
        sv: 'Foton'
    },
    artwork: {
        en: 'Artwork',
        de: 'Cover',
        pt: 'Arte de capa',
        sv: 'Konst'
    },
    dropzone: {
        en: 'Drag-and-drop an image or click here',
        de: 'Bild hierher ziehen oder hier klicken',
        sv: 'Dra och släpp en bild eller klicka här'
    },
    similar_artists: {
        en: 'Similar Artists',
        de: 'Ähnliche Künstler:innen',
        pt: 'Artistas similares',
        sv: 'Liknande artister'
    },
    artists_similar_to_name: {
        en: 'Artists similar to {n}',
        de: 'Ähnliche Künstler:innen wie {n}',
        sv: 'Liknande artister till {n}'
    },
    biography: {
        en: 'Biography',
        de: 'Biografie',
        pt: 'Biografia',
        ja: 'バイオグラフィー',
        sv: 'Biografi'
    },
    wiki: {
        en: 'Wiki',
        de: 'Wiki',
        sv: 'Wiki'
    },
    listeners: {
        en: 'Listeners',
        de: 'Hörer:innen',
        pt: 'Ouvintes',
        sv: 'Lyssnare'
    },
    listeners_you_know: {
        en: 'Listeners You Know',
        de: 'Hörer:innen, die du kennst',
        pt: 'Ouvintes que você conhece',
        sv: 'Lyssnare du känner'
    },
    count_listeners: {
        en: '{c} listeners',
        de: '{c} Hörer:innen',
        pt: '{c} ouvintes',
        sv: '{c} lyssnare'
    },
    tag: {
        en: 'Tag',
        de: 'Tag',
        sv: 'Tagg'
    },
    tags: {
        en: 'Tags',
        de: 'Tags',
        ja: 'タグ',
        sv: 'Taggar'
    },
    reports: {
        // last.fm listening reports
        en: 'Reports',
        de: 'Berichte',
        ja: 'レポート',
        pt: 'Relatório',
        sv: 'Lyssningsrapport'
    },
    artist_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'artist',
        de: 'Künstlers',
        pt: 'artista',
        sv: 'artistnamnet'
    },
    album_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'album',
        de: 'Albums',
        pt: 'álbum',
        sv: 'albumtiteln'
    },
    track_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'track',
        de: 'Titels',
        pt: 'faixa',
        sv: 'låten'
    },
    lotus_cta: {
        // {t} is replaced by one of the 3 above
        // capitalisation here refers to the lotus system, which corrects
        // titles that are capitalised wrongly eg. 'eSpReSsO' -> 'Espresso'

        // DE: a gender-neutral mention of "this artist" would be "dieses Künstlers/dieser Künstlerin", which doesn't work with this formatting
        // we can either move the words article to the upper string or only use the masculine form ("dieses Künstlers") ~Myrai
        true: {
            en: 'This {t} is being re-capitalised, is it correct?',
            de: 'Die Groß-/Kleinschreibung dieses {t} wird korrigiert, ist das korrekt?',
            pt: '{t} teve a capitalização ajustada, está correto?',
            sv: 'Nurvarande {t} har ändrad kapitalisering, stämmer det här?'
        },
        false: {
            en: 'Is this {t} capitalised correctly?',
            de: 'Ist die Groß-/Kleinschreibung dieses {t} richtig?',
            pt: 'Esse(a) {t} está capitalizado(a) corretamente?',
            sv: 'Stämmer kapitaliseringen på {t}?'
        }
    },
    current: {
        en: 'Current',
        de: 'Aktuell',
        sv: 'Nuvarande'
    },
    current_tip: {
        en: 'This is the original capitalisation present on Last.fm',
        de: 'Dies ist die originale Groß-/Kleinschreibung auf Last.fm',
        sv: 'Det här är den originella kapitaliseringen som finns på Last.fm'
    },
    correction: {
        en: 'Correction',
        de: 'Korrektur',
        sv: 'Korrigering'
    },
    correction_tip: {
        en: 'This is the correct capitalisation, as decided by the artist',
        de: 'Dies ist die korrekte Groß-/Kleinschreibung, wie sie vom Künstler festgelegt wurde',
        sv: 'Det här är rätt kapitalisering, som bestämd av artisten'
    },
    sources: {
        en: 'Sources',
        de: 'Quellen',
        sv: 'Källor'
    },
    sources_tip: {
        en: 'Provide reputable sources where this capitalisation is present, excluding sites like Wikipedia, RYM, AOTY, and MusicBrainz',
        de: 'Gebe seriöse Quellen an, auf denen diese Schreibweise zu finden ist, ausgenommen sind Seiten wie Wikipedia, RYM, AOTY und MusicBrainz',
        sv: 'Visa pålitliga källor där man kan se att denna kapitalisering stämmer, förutom sidor som Wikipedia, RYM, AOTY och MusicBrainz'
    },
    suggest: {
        en: 'Suggest',
        de: 'Vorschlagen',
        sv: 'Föreslå'
    },
    please_match_the_format: {
        en: 'Only capitalisation changes are allowed',
        de: 'Nur Änderungen der Groß-/Kleinschreibung sind erlaubt',
        sv: 'Endast ändringar på kapitalisering är tillåtet'
    },
    suggest_correction: {
        // suggest a correction for the above system
        en: 'Suggest a correction',
        de: 'Korrektur vorschlagen',
        pt: 'Sugira uma correção',
        sv: 'Föreslå en ändring'
    },
    recent_tracks: {
        en: 'Recent Tracks',
        de: 'Kürzlich gehört',
        pt: 'Faixas recentes',
        ja: '最近のトラック',
        sv: 'Nyligen spelat'
    },
    top_artists: {
        en: 'Top Artists',
        de: 'Top-Künstler:innen',
        pt: 'Top Artistas',
        ja: 'トップアーティスト',
        sv: 'Toppartister'
    },
    top_albums: {
        en: 'Top Albums',
        de: 'Top-Alben',
        pt: 'Top Álbuns',
        ja: '人気アルバム',
        sv: 'Toppalbum'
    },
    top_tracks: {
        en: 'Top Tracks',
        de: 'Top-Songs',
        pt: 'Top Faixas',
        ja: '人気トラック',
        sv: 'Topplåtar'
    },
    top_track: {
        en: 'Top Track',
        de: 'Top-Song',
        pt: 'Top Faixa',
        sv: 'Topplåt'
    },
    you_share_count_with: {
        // as in your musical taste between you and someone else
        // you are {percentage%} compatible (in taste) {list of artists}
        en: 'You are {c} compatible',
        de: 'Ihr seid {c} kompatibel',
        pt: 'Voce é {c} compatível',
        sv: 'Du är {c} kompatibel',
        one: {
            en: '{artist}'
        },
        two: {
            en: '{artist1}, {artist2}',
            ja: '{artist1}、{artist2}'
        },
        three: {
            en: '{artist1}, {artist2}, {artist3}',
            ja: '{artist1}、{artist2}、{artist3}'
        }
    },
    taste_similarity: {
        en: 'Taste similarity',
        de: 'Musikgeschmack-Ähnlichkeit',
        pt: 'Similaridade de gostos',
        sv: 'Smaklikhet'
    },
    plays_lower: {
        // eg. 20 plays in artist/album grid
        // copy from last.fm
        en: ' plays',
        de: ' Plays',
        pt: ' reproduções',
        ja: '曲を再生',
        sv: ' spelningar'
    },
    message: {
        // as in a direct message
        en: 'Message',
        de: 'Nachricht schreiben',
        pt: 'Mensagem',
        sv: 'Meddela'
    },
    join_discord: {
        en: 'Join Discord',
        de: 'Discord beitreten',
        sv: 'Gå med i Discord'
    },
    sponsor_details: {
        en: 'Sponsor and badge details',
        de: 'Sponsoren- und Abzeichendetails',
        sv: 'Sponsor och emblemdetaljer'
    },
    sponsor_data: {
        en: 'Sponsor and badge data version {v}',
        de: 'Sponsoren- und Abzeichendaten-Version {v}',
        pt: 'Versão da data de apoiador e emblemas',
        sv: 'Sponsor-och-emblemdata, version {v}'
    },
    sponsor: {
        en: 'Become a sponsor',
        de: 'Werde Sponsor',
        pt: 'Torne-se um apoiador',
        sv: 'Bli en sponsor'
    },
    message_sponsor: {
        // rewards meaning a badge for example
        en: 'Receive sponsor rewards',
        de: 'Sponsorenprämien erhalten',
        pt: 'Receba recompensas de apoiador',
        sv: 'Få sponsorpriser'
    },
    news_sponsor_cta: {
        en: 'Want to support future development of bleh?',
        de: 'Möchtest du die zukünftige Entwicklung von bleh unterstützen?',
        pt: 'Quer apoiar o desenvolvimento futuro do bleh?',
        sv: 'Vill du stödja blehs framtida utveckling?'
    },
    support_future_development: {
        // in the context of sponsoring
        en: 'Support future development',
        de: 'Unterstütze die zukünftige Entwicklung',
        pt: 'Apoie o desenvolvimento futuro',
        sv: 'Stöd framtida utveckling'
    },
    why_sponsor: {
        en: 'Receive a profile badge and a big thank you from katelyn <3',
        de: 'Erhalte ein Abzeichen auf deinem Profil und ein großes Dankeschön von katelyn für deine Unterstützung <3',
        pt: 'Receba um emblema no seu perfil e um obrigadão da katelyn por apoiar <3',
        sv: 'Få ett emblem på din profil och ett stort tack från katelyn <3'
    },
    you_are_a_sponsor: {
        en: 'You are a sponsor, thank you! :3',
        de: 'Du bist ein Sponsor, danke schön! :3',
        pt: 'Você é um apoiador, muito obrigado! :3',
        sv: 'Du är en sponsor, tack så mycket! :3'
    },
    sponsor_get_badge: {
        en: 'A monthly sponsorship grants you a custom badge of your choosing',
        de: 'Mit einem monatlichen Sponsoring erhältst du ein individuelles Abzeichen deiner Wahl',
        pt: 'Um apoio mensal lhe dá um emblema personalizado de sua escolha',
        sv: 'Med ett månatligt sponsorskap får du ett emblem du själv kan anpassa'
    },
    sponsor_no_badge: {
        en: 'A custom badge is only available with a monthly sponsorship.',
        de: 'Ein individuelles Abzeichen ist nur mit einem monatlichen Sponsoring erhältlich',
        pt: 'Um emblema personalizado só está disponível com um apoio mensal',
        sv: 'Ett eget anpassat emblem finns bara tillgängligt med månatligt sponsorskap'
    },
    manage_sponsor: {
        en: 'Manage sponsorship',
        de: 'Sponsoring verwalten',
        pt: 'Gerenciar apoio',
        sv: 'Sponsorskapsinställningar'
    },
    view: {
        en: 'View',
        de: 'Ansehen',
        pt: 'Ver',
        sv: 'Visa'
    },
    profile_and_badges: {
        en: 'Profile, {c} badges',
        de: 'Profil, {c} Abzeichen',
        pt: 'Perfil, {c} emblemas',
        sv: 'Profil, {c} emblem'
    },
    current_version: {
        en: 'Current version',
        de: 'Aktuelle Version',
        pt: 'Versão atual',
        sv: 'Nuvarande version'
    },
    labs: {
        en: 'Labs',
        de: 'Labs',
        sv: 'Labs'
    },
    labs_by_last: {
        en: 'Labs by Last.fm',
        de: 'Labs von Last.fm',
        pt: 'Labs da Last.fm',
        sv: 'Labs av Last.fm',
        tagline: {
            en: 'Interactive tools and infographics',
            de: 'Interaktive Tools und Infografiken',
            pt: 'Ferramentas interativas e infográficos',
            sv: 'Interaktiva verktyg och infografik'
        }
    },
    sponsor_info: {
        en: 'This is a special bleh-managed profile to handle sponsors',
        de: 'Dies ist ein bleh-verwaltetes Profil zur Verwaltung von Sponsoren',
        pt: 'Este é um perfil especial gerenciado pelo bleh para lidar com apoiadores',
        sv: 'Detta är en speciell profil från bleh för att hantera sponsorskap'
    },
    sponsors_only: {
        en: 'Sponsors only',
        de: 'Nur für Sponsoren',
        sv: 'Endast sponsorer'
    },
    downloaded_value: {
        en: 'Downloaded {v}',
        de: '{v} wurde heruntergeladen',
        sv: 'Laddat ned {v}'
    },
    loading: {
        en: 'Loading',
        de: 'Wird geladen',
        pt: 'Carregando',
        sv: 'Laddar'
    },
    loading_count_days: {
        en: 'Collecting the last {c} days',
        de: 'Sammeln der letzten {c} Tage',
        pt: 'Coletando os últimos {c} dias',
        sv: 'Samlar de senaste {c} dagarna'
    },
    gathering_plays: {
        en: 'Gathering plays',
        de: 'Plays werden gesammelt',
        pt: 'Coletando reproduções',
        sv: 'Samlar spelningar'
    },
    following_mutuals: {
        // this is appended after the following button text if mutuals
        // eg. Following (mutually)
        en: '(mutually)',
        de: '(gegenseitig)',
        pt: '(mutualmente)',
        sv: '(varandra)'
    },
    language: {
        en: 'Language',
        de: 'Sprache',
        pt: 'Idioma',
        sv: 'Språk'
    },
    symbol_presets: {
        // as in a selection of characters (symbols, text) that can
        // be used when editing wikis
        en: 'Symbol presets',
        de: 'Symbolvoreinstellungen',
        pt: 'Predefinições de símbolos',
        sv: 'Symboler'
    },
    fancy_syntax: {
        // hyperlink as in a link to a website or something,
        // common internet word not sure if it translates?
        en: 'Hyperlink guide',
        de: 'Hyperlink-Leitfaden',
        pt: 'Guia de hiperlink',
        sv: 'Länkguide'
    },
    links_to: {
        // used in wiki editing, {this example} links to {link}
        en: 'Links to {link}',
        de: 'Verlinkt auf {link}',
        pt: 'Links para {link}',
        sv: 'Länkas till {link}'
    },
    explore_in_library: {
        en: 'Explore in library',
        de: 'In der Bibliothek anzeigen',
        pt: 'Explorar na biblioteca',
        sv: 'Utforska i bibliotek'
    },
    add_note: {
        // as in a profile note
        en: 'Add note',
        de: 'Notiz hinzufügen',
        pt: 'Adicionar nota',
        sv: 'Lägg till anteckning'
    },
    radio: {
        en: 'Radio',
        de: 'Radio',
        pt: 'Rádio',
        sv: 'Radio'
    },
    mix: {
        // as in a playlist mix of music
        en: 'Mix',
        de: 'Mix',
        sv: 'Mix'
    },
    recommended: {
        // recommended music
        en: 'Recommended',
        de: 'Empfohlen',
        pt: 'Recomendações',
        sv: 'Rekommenderad'
    },
    listening: {
        // used as the card header for radios and listening reports
        en: 'Listening',
        de: 'Hörbericht',
        pt: 'Ouvindo',
        sv: 'Lyssning'
    },
    you: {
        en: 'You',
        de: 'Du',
        pt: 'Você',
        sv: 'Du'
    },
    open: {
        en: 'Open',
        de: 'Öffnen',
        pt: 'Abrir',
        sv: 'Öppen'
    },
    expand: {
        en: 'Expand',
        de: 'Erweitern',
        pt: 'Expandir',
        sv: 'Expandera'
    },
    expand_to_full_resolution: {
        en: 'Expand to full resolution',
        de: 'Auf volle Auflösung erweitern',
        pt: 'Expandir para resolução total',
        sv: 'Expandera till full upplösning'
    },
    share: {
        en: 'Share',
        de: 'Teilen',
        pt: 'Compartilhar',
        sv: 'Dela'
    },
    copy: {
        en: 'Copy',
        de: 'Kopieren',
        pt: 'Copiar',
        sv: 'Kopiera'
    },
    copy_username: {
        en: 'Copy username',
        de: 'Benutzername kopieren',
        sv: 'Kopiera användarnamn'
    },
    copy_link: {
        en: 'Copy link',
        de: 'Link kopieren',
        sv: 'Kopiera länk'
    },
    copied_to_clipboard: {
        en: 'Copied to clipboard',
        de: 'In die Zwischenablage kopiert',
        pt: 'Copiado para a área de transferência',
        sv: 'Kopierats till urklipp'
    },
    click_to_copy: {
        en: 'Click to copy',
        de: 'Klicken zum kopieren',
        pt: 'Clique para copiar',
        sv: 'Klicka för att kopiera'
    },
    wiki_standard_tracks: {
        en: 'Track titles should be wrapped in quotation marks (“ ”)',
        de: 'Songtitel sollten von Anführungszeichen umgeben sein (“ ”)',
        pt: 'Os títulos das faixas devem ser colocados entre aspas (“ ”)',
        sv: 'Låtnamn ska omges av citattecken (“ ”)'
    },
    wiki_standard_artists: {
        en: 'Album and artist names are left without quotes',
        de: 'Namen von Alben und Künstler:innen werden ohne Anführungszeichen geschrieben',
        pt: 'Os nomes dos álbuns e artistas não devem ser colocados entre aspas.',
        sv: 'Album och artistnamn ska skrivas utan citattecken'
    },
    wiki_standard_quotations: {
        en: 'Use ‘ ’ for quotations from the artist or elsewhere',
        de: 'Verwende ‘ ’ für Zitate des Künstlers oder aus anderen Quellen',
        pt: 'Use ‘ ’ para citações do artista ou de outras fontes.',
        sv: 'Använd ‘ ’ för citat från artisten eller från annanstans'
    },
    activity: {
        en: 'Activity',
        de: 'Aktivität',
        pt: 'Atividade',
        sv: 'Aktivitet',
        listing: {
            shout: {
                en: 'Shout',
                de: 'Shout hinterlassen',
                pt: 'Enviou mensagem',
                sv: 'Hojt'
            },
            image_upload: {
                en: 'Uploaded image',
                de: 'Bild hochgeladen',
                pt: 'Enviou imagem',
                sv: 'Laddat upp bild'
            },
            image_star: {
                en: 'Starred image',
                de: 'Bild als Favorit markiert',
                pt: 'Favoritou imagem',
                sv: 'Valt favoritbild'
            },
            obsess: {
                en: 'Obsessed',
                de: 'Obsession festgelegt',
                pt: 'Obcecou',
                sv: 'Besatthet'
            },
            unobsess: {
                en: 'Removed obsession',
                de: 'Obsession entfernt',
                pt: 'Desobcecou',
                sv: 'Tagit bort besatthet'
            },
            love: {
                en: 'Loved',
                de: 'Zu Favoriten hinzugefügt',
                pt: 'Favoritou',
                sv: 'Älskade låt'
            },
            unlove: {
                en: 'Removed love',
                de: 'Favorit entfernt',
                pt: 'Desfavoritou',
                sv: 'Tog bort som älskad'
            },
            install_bwaa: {
                en: 'Installed bwaa',
                de: 'bwaa wurde installiert',
                pt: 'Instalou o bwaa',
                sv: 'Installerade bwaa'
            },
            update_bwaa: {
                en: 'Updated bwaa',
                de: 'bwaa wurde aktualisiert',
                pt: 'Atualizou o bwaa',
                sv: 'Uppdaterade bwaa'
            },
            install_bleh: {
                en: 'Installed bleh',
                de: 'bleh wurde installiert',
                pt: 'Instalou o bleh',
                sv: 'Installerade bleh'
            },
            update_bleh: {
                en: 'Updated bleh',
                de: 'bleh wurde aktualisiert',
                pt: 'Atualizou o bleh',
                sv: 'Uppdaterade bleh'
            },
            bookmark: {
                en: 'Bookmarked',
                de: 'Lesezeichen hinzugefügt',
                pt: 'Adicionou marcação',
                sv: 'Bokmärkte'
            },
            unbookmark: {
                en: 'Removed bookmark',
                de: 'Lesezeichen entfernt',
                pt: 'Removeu marcação',
                sv: 'Tog bort bokmärke'
            },
            wiki: {
                en: 'Edited',
                de: 'Bearbeitet',
                pt: 'Editou',
                sv: 'Redigerade'
            }
        },
        types: {
            shout: {
                en: 'Comments and replies from you across the site',
                de: 'Kommentare und Antworten von dir auf der gesamten Site',
                pt: 'Seus comentários e respostas ao redor do site',
                sv: 'Kommentarer och svar från dig över hela sidan'
            },
            image: {
                en: 'Uploading images and starring for your layout',
                de: 'Bilder hochladen und Sterne für dein Layout vergeben',
                pt: 'Imagens enviadas e favoritos do seu layout',
                sv: 'Uppladdning av bilder och väljer favoritbilder'
            },
            obsess: {
                en: 'Tracks you have on loop',
                de: 'Titel, die du auf Dauerschleife hast',
                pt: 'Faixas que você tem em loop',
                sv: 'Låtar du är besatt av'
            },
            love: {
                en: 'Tracks you love',
                de: 'Deine Lieblingssongs',
                pt: 'Faixas que você ama',
                sv: 'Låtar du älskar'
            },
            bookmark: {
                en: 'Music you want to check out',
                de: 'Musik, die du auschecken solltest',
                pt: 'Música que você quer conferir',
                sv: 'Musik du vill komma ihåg till senare'
            },
            wiki: {
                en: 'Editing of any wiki',
                de: 'Bearbeiten jeglicher Wikis',
                pt: 'Editando de qualquer wiki',
                sv: 'Wikiredigering'
            },
            install: {
                en: 'First installations and updating',
                de: 'Erstinstallationen und Aktualisierungen',
                pt: 'Primeiras instalações e atualizações',
                sv: 'Första installationen och uppdateringar'
            }
        }
    },
    what_are_activities: {
        en: 'Keep track of your most recent activity locally on your profile',
        de: 'Verfolge deine letzten Aktivitäten lokal auf deinem Profil',
        pt: 'Acompanhe suas atividades mais recentes localmente em seu perfil',
        sv: 'Håll koll på dina senaste aktiviteter lokalt på din profil'
    },
    activity_tracking: {
        name: {
            en: 'Track my activities',
            de: 'Meine Aktivitäten tracken',
            pt: 'Acompanhar minhas atividades',
            sv: 'Spåra mina aktiviteter'
        },
        body: {
            en: 'Activities will only be registered while enabled',
            de: 'Aktivitäten werden nur getrackt, wenn du es aktivierst',
            pt: 'As atividades só serão registradas enquanto estiverem habilitadas',
            sv: 'Aktiviteter läggs bara till när inställningen är aktiverad'
        }
    },
    clear_history: {
        en: 'Clear history',
        de: 'Verlauf löschen',
        pt: 'Limpar histórico',
        sv: 'Töm historia'
    },
    cleared_activity_history: {
        en: 'Cleared your activity history',
        de: 'Dein Aktivitätsverlauf wurde gelöscht',
        pt: 'Histórico de atividades limpo',
        sv: 'Tömde din aktivitetshistoria'
    },
    activity_settings: {
        en: 'Activity settings',
        de: 'Aktivitätseinstellungen',
        pt: 'Configurações de atividade',
        sv: 'Redigera dina aktiviteter'
    },
    installation: {
        en: 'Installation',
        de: 'Installation',
        pt: 'Instalação',
        sv: 'Installation'
    },
    grid: {
        // as in the view mode
        en: 'Grid',
        de: 'Raster',
        pt: 'Grade',
        sv: 'Bildruta'
    },
    list: {
        // as in the view mode
        en: 'List',
        de: 'Liste',
        pt: 'Linha',
        sv: 'Lista'
    },
    line: {
        // as in the type of chart (a line graph)
        en: 'Line',
        de: 'Linien',
        pt: 'Lista',
        sv: 'Linjediagram'
    },
    pie: {
        // as in the type of chart (a pie chart)
        en: 'Pie',
        de: 'Kreis',
        pt: 'Pizza',
        sv: 'Cirkeldiagram'
    },
    bar: {
        // as in the type of chart (a bar chart)
        en: 'Bar',
        de: 'Balken',
        pt: 'Coluna',
        sv: 'Stapeldiagram'
    },
    horizontal: {
        en: 'Horizontal',
        de: 'Horizontal',
        sv: 'Vågrätt'
    },
    vertical: {
        en: 'Vertical',
        de: 'Vertikal',
        sv: 'Lodrätt'
    },
    this_year: {
        en: 'This year',
        de: 'Dieses Jahr',
        pt: 'Este ano',
        sv: 'Detta år'
    },
    last_year: {
        en: 'Last year',
        de: 'Letztes Jahr',
        pt: 'Ano passado',
        sv: 'Förra året'
    },
    love: {
        // as in loving tracks as a concept
        en: 'Love',
        de: 'Als Lieblingssong markieren',
        pt: 'Favoritas',
        sv: 'Älska'
    },
    loved: {
        // as in loved tracks, this can be seen
        // in the native last.fm ui
        en: 'Loved',
        de: 'Als Lieblingssong markiert',
        pt: 'Favoritadas',
        sv: 'Älskade låtar'
    },
    velocity: {
        // as in the last.fm labs 'Velocity' tool
        en: 'Velocity',
        de: 'Dynamik',
        pt: 'Velocidade',
        sv: 'Velocitet'
    },
    logout: {
        en: 'Logout',
        de: 'Abmelden',
        pt: 'Sair',
        ja: 'ログアウト',
        sv: 'Logga ut'
    },
    tracklist: {
        // please copy from native last.fm ui
        en: 'Tracklist',
        de: 'Titelliste',
        pt: 'Lista de faixas',
        sv: 'Spellista'
    },
    tracklist_from_plays_info: {
        en: 'Retrieved own plays as official tracklist is unavailable',
        de: 'Eigene Plays abgerufen, da die offizielle Titelliste nicht verfügbar ist',
        pt: 'Reproduções próprias recuperadas, pois a lista de faixas oficial não está disponível',
        sv: 'Hämtade dina spelningar för en officiell spellista finns inte tillgänglig'
    },
    from_the_album: {
        en: 'From {album}',
        de: 'Auf {album}',
        pt: 'Do {album}',
        sv: 'Från {album}'
    },
    listens: {
        // base on native last.fm ui
        en: 'listens',
        de: 'Scrobbles',
        pt: 'scrobbles',
        sv: 'skrobblingar',
        count: {
            en: '{c} listens',
            de: '{c} Scrobbles',
            pt: '{c} scrobbles',
            sv: '{c} skrobblingar'
        }
    },
    others_count: {
        // the amount of other users
        en: '{c} others',
        de: '{c} weitere',
        pt: '{c} outros',
        sv: '{c} andra'
    },
    loading_album_plays: {
        en: 'Collecting your album plays',
        de: 'Sammeln deiner Albumwiedergaben',
        pt: 'Coletando suas reproduções de álbuns',
        sv: 'Samlar ihop dina albumspelningar'
    },
    fail_album_plays: {
        en: 'No plays could be found',
        de: 'Es konnten keine Plays gefunden werden',
        pt: 'Nenhuma reprodução pôde ser encontrada',
        sv: 'Kunde inte hitta på albumspelningar'
    },
    open_album_as_track: {
        en: 'Open album title as track',
        de: 'Albumtitel als Song öffnen',
        pt: 'Abrir título do álbum como faixa',
        sv: 'Öppna albumtitel som egen låt'
    },
    ignored: {
        en: 'Ignored',
        de: 'Ignoriert',
        pt: 'Ignorados',
        sv: 'Ignorerad'
    },
    count_total: {
        en: '{c} total',
        de: '{c} insgesamt',
        sv: '{c} totalt'
    },
    video_removed: {
        en: 'Video removed by Last.fm',
        de: 'Video von Last.fm entfernt',
        pt: 'Vídeo removido pela Last.fm',
        sv: 'Video borttagen av Last.fm'
    },
    blocked_page: {
        en: 'This page has been limited by Last.fm',
        de: 'Diese Seite wurde von Last.fm eingeschränkt',
        pt: 'Esta página foi limitada pela Last.fm',
        sv: 'Denna sida har begränsats av Last.fm'
    },
    results_for: {
        // used as a header above the actual search eg.
        // Results for
        // "random search text"
        en: 'Results for',
        de: 'Ergebnisse für',
        pt: 'Resultados para',
        sv: 'Sökresultat för'
    },
    create_new_event: {
        en: 'Create new event',
        de: 'Neues Event hinzufügen',
        pt: 'Criar novo evento',
        sv: 'Skapa ett nytt evenemang'
    },
    related_to: {
        // used for similar tags
        en: 'Related to',
        de: 'Verwandte Tags',
        pt: 'Relacionado a',
        sv: 'Förknippad med'
    },
    personal_tag: {
        en: 'Personal tag',
        de: 'Persönliches Tag',
        pt: 'Marcador pessoal',
        sv: 'Din tagg'
    },
    your_avatar: {
        en: 'Your avatar',
        de: 'Dein Profilbild',
        pt: 'Sua foto',
        sv: 'Din profilbild'
    },
    avatar_for_user: {
        // this is used to replace the text and extract the
        // username, so make this text everything BUT where
        // the username goes (including spaces)
        // you can find this text in the last.fm ui as every
        // avatar's (except your own) alt text
        en: 'Avatar for ',
        de: 'Profilbild von ',
        pt: 'Avatar de',
        sv: 'Avatar för '
    },
    by: {
        en: 'by',
        de: 'von',
        pt: 'por',
        sv: 'av'
    },
    by_user: {
        en: 'by {u}',
        de: 'von {u}',
        pt: 'por {u}',
        sv: 'av {u}'
    },
    by_artist: {
        // {name} by {artist} - hence the space in english
        en: ' by {a}',
        de: ' von {a}',
        pt: ' por {a}',
        sv: ' av {a}'
    },
    value_by_user: {
        en: '{v} by {u}',
        de: '{v} von {u}',
        pt: '{v} por {u}'
    },
    average: {
        // scrobble average
        en: 'Average',
        de: 'Durchschnitt',
        pt: 'Média',
        sv: 'Genomsnitt'
    },
    from_user: {
        en: 'from {u}',
        de: 'Von {u}',
        pt: 'de {u}',
        sv: 'från {u}'
    },
    open_new_tab: {
        en: 'Open in a new tab',
        de: 'In neuem Tab öffnen',
        pt: 'Abrir em nova aba',
        sv: 'Öppna i ny flik'
    },
    event_cancelled: {
        // obviously remove the emoji or replace it as
        // you see fit if desired
        en: 'This event has been cancelled (╥﹏╥)',
        de: 'Dieses Event wurde abgesagt (╥﹏╥)',
        pt: 'Este evento foi cancelado (╥﹏╥)',
        sv: 'Detta evenemang har avbrutits (╥﹏╥)'
    },
    format_guest_features: {
        name: {
            en: 'Smart credited artists and song tags',
            de: 'Intelligente Künstler- und Song-Tags',
            pt: 'Tags inteligentes de artistas e músicas',
            sv: 'Smartformat för gästartister och låttaggar'
        },
        body: {
            en: 'Analyses album and track titles into their guests, versions, remixes, etc.',
            de: 'Analysiert Album- und Songtitel hinsichtlich ihrer Versionen, Remixe usw.',
            pt: 'Analisa títulos de álbuns e faixas e os separa em seus convidados, versões, remixes etc.',
            sv: 'Analyserar album och låttitlar till gästartister, olika versioner, remixar osv.'
        }
    },
    show_guest_features: {
        name: {
            en: 'Duplicate credited artists in title',
            de: 'Doppelte Nennung der Künstler:innen im Titel',
            pt: 'Artistas creditados duplicados no título',
            sv: 'Duplicera artistnamn i låttitel'
        },
        body: {
            en: 'Otherwise guests are neatly placed next to the primary artist',
            de: 'Ansonsten werden gefeaturete Künstler:innen neben dem/der Hauptkünstler:in platziert',
            pt: 'Caso contrário os convidados são organizados de forma elegante ao lado do artista principal',
            sv: 'Annars placeras gästartister fint bredvid huvudartisten'
        }
    },
    track_column_view: {
        en: 'Use column view for tracklist information',
        de: 'Verwende die Spaltenansicht für Titellisteninformationen',
        pt: 'Use a visualização em colunas para as informações das faixas',
        sv: 'Använd kolumnvy för låtlistsinformation'
    },
    show_remaster_tags: {
        en: 'Show remaster tags',
        de: 'Remaster-Tags anzeigen',
        pt: 'Mostrar as tags de remaster',
        sv: 'Visa remaster-taggar'
    },
    recent_realtime: {
        name: {
            en: 'Refresh tracks automatically',
            de: 'Titel automatisch aktualisieren',
            pt: 'Atualizar faixas automaticamente',
            sv: 'Automatiskt uppdatera låtar'
        },
        body: {
            en: 'View your listening history in realtime',
            de: 'Sehe deinen Hörverlauf in Echtzeit an',
            pt: 'Veja seu histórico de scrobbles em tempo real',
            sv: 'Visa din lyssningshistorik i realtid'
        }
    },
    amount_to_display: {
        // Amount of tracks to display in recent tracks
        en: 'Amount of tracks to display',
        de: 'Anzahl der anzuzeigenden Titel',
        pt: 'Quantidade a ser exibida',
        sv: 'Mängd att visa'
    },
    recent_artwork: {
        en: 'Accompany tracks with artwork',
        de: 'Titel mit Albumcover anzeigen',
        pt: 'Mostrar as faixas juntamente a capa',
        sv: 'Visa skivomslag vid låt'
    },
    default_timeframe: {
        en: 'Default timeframe',
        de: 'Standardzeitraum',
        pt: 'Período padrão',
        ja: 'デフォルト期間',
        sv: 'Standardtidsram'
    },
    timeframe: {
        en: 'Timeframe',
        de: 'Zeitraum',
        sv: 'Tidsram'
    },
    item_type: {
        en: 'Item type',
        de: 'Objekttyp',
        sv: 'Objekttyp'
    },
    page_count: {
        en: 'Page count',
        de: 'Seitenanzahl',
        sv: 'Mängd sidor'
    },
    chart_style: {
        en: 'Chart style',
        de: 'Diagrammstil',
        pt: 'Estilo da tabela',
        ja: 'チャートスタイル',
        sv: 'Liststil'
    },
    chart_size: {
        en: 'Chart size',
        de: 'Diagrammgröße',
        pt: 'Tamanho da tabela',
        sv: 'Liststorlek'
    },
    country: {
        en: 'Country',
        de: 'Land',
        pt: 'País',
        sv: 'Land'
    },
    subtitle: {
        en: 'Subtitle',
        de: 'Untertitel',
        pt: 'Legenda',
        sv: 'Undertext'
    },
    pronoun_tip: {
        en: 'Pronouns are specially supported if placed first',
        de: 'Pronomen werden unterstützt, wenn sie an erster Stelle stehen',
        pt: 'Os pronomes são especialmente apoiados se colocados primeiro',
        sv: 'Pronomen har speciellt stöd om det placeras först'
    },
    block_list: {
        en: 'Block list',
        de: 'Blockierliste',
        pt: 'Lista de bloqueados',
        sv: 'Blocklista'
    },
    when_blocked: {
        en: 'What happens with blocked users?',
        de: 'Was passiert mit blockierten Benutzern?',
        pt: 'O que acontece com os usuários bloqueados?',
        sv: 'Vad händer med blockerade användare?'
    },
    blocked_count: {
        en: 'You have blocked {c} profiles',
        de: 'Du hast {c} Benutzer blockiert',
        pt: 'Você bloqueou {c} perfis',
        sv: 'Du har blockerat {c} profiler'
    },
    enter_username: {
        en: 'Enter username',
        de: 'Benutzername eingeben',
        pt: 'Insira o nome de usuário',
        sv: 'Skriv användarnamn'
    },
    block: {
        en: 'Block',
        de: 'Blockieren',
        pt: 'Bloquear',
        sv: 'Blockera'
    },
    blocked: {
        en: 'Blocked',
        de: 'Blockiert',
        pt: 'Bloqueado',
        sv: 'Blockerad'
    },
    blocked_user_public: {
        en: 'Can leave shouts but not viewable to you',
        de: 'Kann Shouts hinterlassen, diese sind aber nicht für dich sichtbar',
        pt: 'Podem deixar mensagens, mas elas não são visíveis para você',
        sv: 'Hojtningar på allmäna profiler syns inte för dig'
    },
    blocked_user_message: {
        en: 'Cannot direct message you',
        de: 'Kann dir keine Direktnachrichten senden.',
        pt: 'Não podem lhe enviar mensagens diretas',
        sv: 'Kan inte skicka privat meddelande till dig'
    },
    blocked_user_new_shouts: {
        en: 'Cannot leave shouts or reply to you',
        de: 'Kann keine Shouts hinterlassen oder dir antworten',
        pt: 'Não podem deixar mensagens na sua caixa de mensagens ou lhe responder',
        sv: 'Kan inte lämna hojtningar på din profil eller svara på dina hojtningar'
    },
    blocked_user_old_shouts: {
        en: 'You cannot delete pre-existing shouts on your profile',
        de: 'Bereits vorhandene Shouts auf deinem Profil werden nicht gelöscht',
        pt: 'Você não pode deletar mensagens já existentes em seu perfil',
        sv: 'Du kan inte ta bort deras tidigare hojtningar från din profil'
    },
    blocked_user_view_profile: {
        en: 'They can still view your profile',
        de: 'Die Person kann weiterhin dein Profil ansehen',
        pt: 'Eles ainda podem ver seu perfil',
        sv: 'Dem kan fortfarande se din profil'
    },
    no_quote: {
        en: '...'
    },
    shared_with_others: {
        en: 'Shared with others',
        de: 'Mit anderen geteilt',
        pt: 'Compartilhado com outros',
        sv: 'Delades med andra'
    },
    others_from_profile: {
        en: 'More from {user}',
        de: 'Mehr von {user}',
        pt: 'Mais de {user}',
        sv: 'Mer från {user}'
    },
    obsess: {
        en: 'Obsess',
        de: 'Als Obsession festlegen',
        pt: 'Definir como obsessão',
        sv: 'Ställ in som besatthet'
    },
    obsession: {
        en: 'Obsession',
        de: 'Obsession',
        pt: 'Obsessão',
        sv: 'Aktuell besatthet'
    },
    obsessions: {
        en: 'Obsessions',
        de: 'Obsessionen',
        pt: 'Obsessões',
        sv: 'Besattheter'
    },
    finding_your_tracks: {
        en: 'Finding your tracks',
        de: 'Deine Titel werden gesucht',
        pt: 'Encontrando suas faixas',
        sv: 'Hittar på dinna låtar'
    },
    update_check: {
        en: 'Check for updates',
        de: 'Nach Updates suchen',
        pt: 'Procurar atualizações',
        sv: 'Kolla efter uppdateringar'
    },
    music_corrections: {
        en: 'Music corrections',
        de: 'Musik-Korrekturen',
        pt: 'Correções de música',
        sv: 'Musikredigeringar'
    },
    corrections_loaded: {
        en: 'Corrections loaded',
        de: 'Korrekturen wurden geladen',
        sv: 'Dina redigeringar har laddat'
    },
    corrections_loaded_value: {
        en: '{c1} artists, {c2} albums and tracks',
        de: '{c1} Künstler:innen, {c2} Alben und Titel',
        sv: '{c1} artister, {c2} album och låtar'
    },
    brand_version: {
        // used for the lotus header where:
        // brand = "lotus"
        // making: 'lotus version'
        en: '{brand} version',
        de: '{brand}-Version',
        pt: '{brand} versão',
        sv: '{brand} version'
    },
    brand_version_number: {
        // used for the lotus header where:
        // brand = "lotus"
        // number = "2025.0507"
        // making: 'lotus version 2025.0507'
        en: '{brand} version {number}',
        de: '{brand}-Version {number}',
        pt: '{brand} versão {number}',
        sv: '{brand} version {number}'
    },
    lotus: {
        artist: {
            en: 'Artist corrections',
            de: 'Künstler:innen-Korrekturen',
            sv: 'Artistredigeringar'
        },
        album_track: {
            en: 'Album and track corrections',
            de: 'Album- und Titel-Korrekturen',
            sv: 'Album och spårredigeringar'
        },
        combined_artists: {
            en: 'Combined artist profiles',
            de: 'Kombinierte Künstler:innen-Profile',
            sv: 'Kombinerade artistprofiler'
        }
    },
    correct_titles_with_lotus: {
        name: {
            en: 'Correct titles with lotus',
            de: 'Titel korrigieren mit lotus',
            pt: 'Corrigir títulos com lotus',
            sv: 'Redigera titlar med lotus'
        },
        body: {
            en: 'Re-capitalise artists, albums, and tracks based on community contributions',
            de: 'Korrigiert die Schreibweise von Künstler:innen, Alben und Titeln basierend auf Community-Beiträgen',
            pt: 'Recapitalize artistas, álbuns e faixas com base nas contribuições da comunidade',
            sv: 'Ändra kapitalisering på artister, album, och låtar från gemenskapsbidrag'
        }
    },
    prefer_no_redirect: {
        name: {
            en: 'Avoid artist redirects when navigating',
            de: 'Vermeide Künstler-Weiterleitungen beim Navigieren',
            pt: 'Evitar redirecionamentos de artistas ao navegar',
            sv: 'Undvik artistomdirigeringar när du surfar'
        },
        body: {
            en: 'Automatically adds +noredirect to artist links to avoid being sent to pages like Travi$ Scott',
            de: 'Fügt automatisch +noredirect zu Künstler-Links hinzu, um zu vermeiden, dass du zu Seiten wie „Travi$ Scott“ weitergeleitet wirst',
            pt: 'Adiciona automaticamente +noredirect em links de artistas para evitar ser redirecionado para páginas como Travi$ Scott',
            sv: 'Lägger automatiskt +noredirect på artistlänkar för att undvika att bli skickad till sidor som t.ex. Travi$ Scott'
        }
    },
    view_all: {
        en: 'View all',
        de: 'Alle ansehen',
        pt: 'Ver tudo',
        sv: 'Visa alla'
    },
    help_contribute: {
        en: 'Help contribute',
        de: 'Helfe mit',
        pt: 'Ajude a contribuir',
        sv: 'Bidra'
    },
    delete: {
        en: 'Delete',
        de: 'Löschen',
        pt: 'Deletar',
        sv: 'Ta bort'
    },
    deleted: {
        en: 'Deleted',
        de: 'Gelöscht',
        pt: 'Deletado',
        sv: 'Borttagen'
    },
    search: {
        en: 'Search',
        de: 'Suchen',
        pt: 'Pesquisar',
        sv: 'Sök'
    },
    search_guest: {
        en: 'Search guest appearances',
        de: 'Suche nach Features',
        pt: 'Pesquisar participações especiais',
        sv: 'Sök gästartister'
    },
    anything_you_can_imagine: {
        // placeholder for your about me
        en: 'Anything you can imagine...',
        de: 'Alles, was du dir vorstellen kannst ...',
        pt: 'Tudo que você pode imaginar...',
        sv: 'Vad som helst du kan föreställa dig...'
    },
    supports_markdown: {
        // markdown: https://www.markdownguide.org/cheat-sheet/
        en: 'Supports Markdown',
        de: 'Unterstützt Markdown',
        pt: 'Suporta o Markdown',
        sv: 'Stöder Markdown',
        header: {
            name: {
                en: 'Header',
                de: 'Überschrift',
                sv: 'Rubrik'
            },
            string: {
                en: '# hi!!',
                de: '# hallo!!',
                sv: '# hej!!'
            }
        },
        bold: {
            name: {
                en: 'Bold',
                de: 'Fett',
                pt: 'Negrito',
                sv: 'Fet text'
            },
            string: {
                en: '**bold**',
                de: '**Fett**',
                pt: '**negrito**',
                sv: '**fet stil**'
            }
        },
        italics: {
            name: {
                en: 'Italics',
                de: 'Kursiv',
                pt: 'Itálico',
                sv: 'Kursiv'
            },
            string: {
                en: '*slanted*',
                de: '*Kursiv*',
                pt: '*inclinado*',
                sv: '*kursiv*'
            }
        },
        bold_italics: {
            name: {
                de: 'Fett kursiv',
                en: 'Bold italics',
                pt: 'Negrito itálico',
                sv: 'Fet kursiv stil'
            },
            string: {
                en: '***slanted but bold***',
                de: '***Fett UND kursiv gleichzeitig!***',
                pt: '***inclinado, mas em negrito***',
                sv: '***fet och kursiv samtidigt***'
            }
        },
        underlined: {
            name: {
                en: 'Underlined',
                de: 'Unterstrichen',
                pt: 'Sublinhado',
                sv: 'Understrykt'
            },
            string: {
                en: '__underlined__',
                de: '__Unterstrichen__',
                pt: '__sublinhado__',
                sv: '__understrykt__'
            }
        }
    },
    value_characters_max: {
        en: '{v} characters max',
        de: 'Maximal {v} Zeichen',
        pt: 'máximo de {v} caracteres',
        sv: 'max {v} tecken'
    },
    profile_shortcut: {
        name: {
            en: 'Profile shortcut',
            de: 'Profilverknüpfung',
            pt: 'Atalho de perfil',
            sv: 'Profilgenväg'
        },
        body: {
            en: 'View their scrobbles alongside yours at all times',
            de: 'Sehe deren Scrobbles jederzeit neben deinen an',
            pt: 'Veja os scrobbles dele(a) junto aos seus o tempo todo',
            sv: 'Visa deras skrobblingar bredvid dina hela tiden'
        },
        linked: {
            en: 'Linked with {u}',
            de: 'Verlinkt mit {u}',
            pt: 'Ligado com {u}',
            sv: 'Länkad ihop med {u}'
        },
        notice: {
            en: 'You already have {u} as your shortcut, are you sure?',
            de: 'Du hast bereits {u} als deinen Shortcut festgelegt, bist du sicher?',
            pt: 'Você já tem {u} como seu atalho, você tem certeza?',
            sv: 'Du har redan {u} som din genväg, är du säker?'
        }
    },
    failed_to_find_profile: {
        en: 'Failed to find profile',
        de: 'Profil konnte nicht gefunden werden',
        pt: 'Falha ao achar perfil',
        sv: 'Kunde ej hitta profilen'
    },
    replace: {
        en: 'Replace',
        de: 'Ersetzen',
        pt: 'Substituir',
        sv: 'Ersätt'
    },
    view_others_library: {
        en: 'View others library',
        de: 'Bibliothek des anderen ansehen',
        pt: 'Ver a biblioteca dos outros',
        sv: 'Visa andra personers bibliotek'
    },
    avatar_radius: {
        name: {
            en: 'Profile avatar shape',
            de: 'Form des Profilbildes',
            pt: 'Formato da imagem de perfil',
            sv: 'Profilbildsform'
        },
        body: {
            en: 'Applies to all profiles, only visible to you',
            de: 'Gilt für alle Profile, nur für dich sichtbar',
            sv: 'Tillämpas på alla profiler, syns bara för dig'
        }
    },
    notes: {
        en: 'Notes',
        de: 'Notizen',
        pt: 'Notas',
        sv: 'Anteckningar'
    },
    no_notes: {
        en: 'No profiles here... (｡•́︿•̀｡)',
        de: 'Keine Profile hier... (｡•́︿•̀｡)',
        pt: 'Sem perfis aqui... (｡•́︿•̀｡)',
        sv: 'Inga profiler här... (｡•́︿•̀｡)'
    },
    font: {
        name: {
            en: 'Font choice',
            de: 'Schriftartauswahl',
            pt: 'Escolha de fonte',
            sv: 'Typsnitts'
        },
        body: {
            en: 'Choose a custom selection of fonts that suit you',
            de: 'Lege eine benutzerdefinierte Auswahl von Schriftarten fest, die zu dir passen',
            pt: 'Selecione uma fonte customizada que te agrada',
            sv: 'Välj ett typsnitt som bäst passar dig'
        }
    },
    font_weight: {
        name: {
            en: 'Font weight',
            de: 'Schriftstärke',
            pt: 'Espessura da fonte',
            sv: 'Typsnittsvikt'
        },
        body: {
            en: 'Used for regular text paragraphs',
            de: 'Wird für normale Textabsätze verwendet',
            pt: 'Usado para parágrafos regulares de texto',
            sv: 'Används för vanliga textstycke'
        }
    },
    font_weight_medium: {
        name: {
            en: 'Medium font weight',
            de: 'Mittlere Schriftstärke',
            pt: 'Espessura média de fonte',
            sv: 'Mindre typsnittsvikt'
        },
        body: {
            en: 'Used for button text and small headers',
            de: 'Wird für Schaltflächentext und kleine Überschriften verwendet',
            pt: 'Usada para texto de botões e pequenos cabeçalhos',
            sv: 'Används för knappar och småa rubriker'
        }
    },
    font_weight_bold: {
        name: {
            en: 'Bold font weight',
            de: 'Große Schriftstärke',
            pt: 'Espessura da fonte em negrito',
            sv: 'Fet typsnittsvikt'
        },
        body: {
            en: 'Used for large headers',
            de: 'Wird für große Überschriften verwendet',
            pt: 'Usado para cabeçalhos grandes',
            sv: 'Används för stora rubriker'
        }
    },
    font_emoji: {
        name: {
            en: 'Emoji compatibility',
            de: 'Emoji-Kompatibilität',
            pt: 'Compatibilidade de emojis',
            sv: 'Emoji-kompatibilitet'
        },
        body: {
            en: 'Required to render emoji properly before Windows 11 🏳️‍⚧️',
            de: 'Erforderlich, um Emojis vor Windows 11 richtig darzustellen 🏳️‍⚧️',
            pt: 'Necessário para renderizar emojis corretamente antes do Windows 11 🏳️‍⚧️',
            sv: 'Krävs för att visa emojis korrekt innan Windows 11 🏳️‍⚧️'
        }
    },
    enter_font_names: {
        en: 'Enter installed font name(s), separated by commas',
        de: 'Gebe die installierte Schriftart durch Kommas getrennt ein',
        pt: 'Nomes das fontes instaladas, separados por vírgulas',
        sv: 'Skriv installerade typsnittsnamn, separerade av kommatecken'
    },
    change_now: {
        en: 'Change now',
        de: 'Jetzt ändern',
        pt: 'Mudar agora',
        sv: 'Ändra nu'
    },
    profiles: {
        en: 'Profiles',
        de: 'Profile',
        pt: 'Perfis',
        sv: 'Profiler'
    },
    redirections: {
        en: 'Redirections',
        de: 'Umleitungen',
        pt: 'Redirecionamentos',
        sv: 'Omdirigeringar'
    },
    legacy_redirects: {
        name: {
            en: 'Legacy scrobble redirection',
            de: 'Legacy-Scrobble-Umleitung',
            pt: 'Redirecionamento de scrobble legado',
            sv: 'Legacy skrobbelomdirigeringar'
        },
        body: {
            en: 'By default, scrobbles will be corrected to faulty replacements that are a decade out of date. Disabling does not fully fix the system but keeps artist names in your library intact.',
            de: 'Standardmäßig „korrigiert“ Last.fm einige deiner Scrobbles automatisch und führt (meist) fehlerhafte Weiterleitungen aus. Durch die Deaktivierung dieser Funktion wird das System zwar nicht vollständig repariert, die Künstlernamen in deiner Bibliothek bleiben jedoch erhalten.',
            pt: 'Por padrão, a Last.fm irá "corrigir automaticamente" alguns dos seus scrobbles para redirecionamentos (na maioria) defeituosos. Desativar essa opção não corrige completamente o sistema, mas mantém os nomes dos artistas na sua biblioteca intactos.',
            sv: 'Vanligtvis omdirigeras skrobblar till felersättningar som är över tio år gamla. Att avaktivera det fixar inte problemet totalt men artistnamn i ditt egna bibliotek visar rätt profil.'
        }
    },
    redirect_messages: {
        name: {
            en: 'Remove page redirection notifications',
            de: 'Benachrichtigungen zur Seitenumleitung deaktivieren',
            pt: 'Remover notificações de redirecionamento de página',
            sv: 'Ta bort omdirigeringsnotifikationer'
        },
        body: {
            en: 'These notifications can let you undo redirections Last.fm forced upon you, but can also be annoying',
            de: 'Mit diesen Benachrichtigungen kannst du die von Last.fm erzwungenen Weiterleitungen rückgängig machen, sie können aber auch lästig sein.',
            pt: 'Essas notificações podem permitir que você desfaça redirecionamentos que a Last.fm impôs a você, mas também podem ser irritantes',
            sv: 'Dessa notiser låter dig ångra omdirigeringar Last.fm tvingade på dig, men dem kan också vara störande'
        }
    },
    colourful_counts: {
        name: {
            en: 'Rank-based colours for artist charts',
            de: 'Rangbasierte Farben für Künstlerdiagramme',
            pt: 'Cores baseadas em classificação para paradas de artistas',
            sv: 'Rangbaserade färger för artistlistor'
        },
        body: {
            en: 'Assigns a colour based on an artist’s all-time ranking in your library',
            de: 'Weist eine Farbe basierend auf dem Allzeit-Ranking eines Künstlers in deiner Bibliothek zu',
            pt: 'Define uma cor pela colocação do artista no ranking geral da sua biblioteca.',
            sv: 'Tillämpar en färg baserad på en artists alltidsranking i ditt bibliotek'
        }
    },
    glacier_graphs: {
        name: {
            en: 'Visualise scrobble graphs better',
            de: 'Scrobble-Diagramme besser visualisieren',
            pt: 'Visualize melhor os gráficos de scrobble',
            sv: 'Bättre visualisera skrobbeldiagram'
        },
        body: {
            en: 'Choose between a tiny delay for a wide range of graph options or legacy Last.fm graphs',
            de: 'Wähle zwischen einer kleinen Verzögerung für eine breitere Palette von Diagrammoptionen oder den älteren Last.fm-Diagrammen',
            pt: 'Escolha entre um pequeno atraso para ter mais opções de gráficos ou usar os gráficos clássicos da Last.fm',
            sv: 'Välj mellan en liten fördröjning för en stor mängd olika diagramalternativ eller använd äldre Last.fm-diagram'
        }
    },
    gendered_tags: {
        name: {
            en: 'Hide gender-based tags',
            de: 'Geschlechtsspezifische Tags ausblenden',
            pt: 'Esconder tags baseadas em gênero',
            sv: 'Göm könsbaserade taggar'
        },
        body: {
            en: 'These tags are often redundant and can never apply to the full range they’re intending',
            de: 'Diese Tags sind oft überflüssig und können nie auf die gesamte Bandbreite angewendet werden, die sie beabsichtigen',
            pt: 'Essas tags costumam ser redundantes e nunca conseguem representar totalmente tudo o que se propõem',
            sv: 'Dessa taggar är ofta överflödiga och gäller inte alltid för allt dem är tänkta att täcka'
        }
    },
    artwork_and_grids: {
        en: 'Artwork and grids',
        de: 'Albencover und Raster',
        pt: 'Capas e grades',
        sv: 'Albumkonst och rutnät'
    },
    gloss: {
        name: {
            en: 'Apply gloss to album covers',
            de: 'Glanz auf Albumcover anwenden',
            pt: 'Aplique relevo nas capas dos álbuns',
            sv: 'Lägg till ett sken på albumkonst'
        },
        body: {
            en: 'Add a layer of shine to album covers globally',
            de: 'Fügt allen Albumcovern einen Glanzeffekt hinzu',
            pt: 'Adicione um toque de brilho em todas as capas de álbuns',
            sv: 'Lägger till ett glansigt lager på all albumkonst'
        }
    },
    grid_glow: {
        name: {
            en: 'Reflect colour below grid items',
            de: 'Farbe unter Rasterobjekten reflektieren',
            pt: 'Refletir a cor abaixo dos itens da grade',
            sv: 'Reflektera färg under rutnätsobjekt'
        },
        body: {
            en: 'Applies a glow below grid items based on the primary colour',
            de: 'Fügt einen Glanzeffekt unter Rasterobjekten hinzu, der auf der Primärfarbe basiert',
            pt: 'Aplica um brilho abaixo dos itens da grade com base na cor primária',
            sv: 'Lägger till färg under rutnätsobjekt som är baserad på den primära färgen'
        }
    },
    skip_to: {
        // skipping to sections in settings
        en: 'Skip to',
        de: 'Springe zu',
        pt: 'Ir até',
        sv: 'Hoppa till'
    },
    information: {
        en: 'Information',
        de: 'Information',
        pt: 'Informação',
        sv: 'Information'
    },
    username: {
        name: {
            en: 'Username',
            de: 'Benutzername',
            pt: 'Nome de usuário',
            sv: 'Användarnamn'
        },
        body: {
            en: 'To change your username hit the button to send an email. Having problems? {a}contact support{/a}.',
            de: 'Um deinen Benutzernamen zu ändern, klicke auf die Schaltfläche „E-Mail senden“. Gibt es Probleme? {a}Kontaktiere den Support{/a}.',
            pt: 'Para alterar seu nome de usuário, clique no botão para enviar um e-mail. Está com problemas?',
            sv: 'För att ändra ditt användarnamn, tryck på knappen för att skicka mejl. Har du ett problem? {a}Kontakta support{/a}.'
        }
    },
    email: {
        en: 'Email',
        de: 'E-Mail',
        pt: 'E-mail',
        sv: 'Mejladress'
    },
    password: {
        en: 'Password',
        de: 'Passwort',
        pt: 'Senha',
        sv: 'Lösenord'
    },
    new_password: {
        en: 'New password',
        de: 'Neues Passwort',
        pt: 'Nova senha',
        sv: 'Nytt lösenord'
    },
    confirm_password: {
        en: 'Confirm password',
        de: 'Passwort bestätigen',
        pt: 'Confirmar senha',
        sv: 'Verifiera lösenord'
    },
    change: {
        en: 'Change',
        de: 'Ändern',
        pt: 'Mudar',
        sv: 'Ändra'
    },
    marketing_emails: {
        name: {
            en: 'Marketing emails',
            de: 'Marketing-E-Mails',
            pt: 'E-mails promocionais',
            sv: 'Marknadsföringsmejl'
        },
        body: {
            en: 'Last.fm can optionally send promotional emails from time to time',
            de: 'Last.fm kann optional gelegentlich Werbe-E-Mails senden',
            pt: 'A Last.fm pode, opcionalmente, enviar e-mails promocionais de tempos em tempos.',
            sv: 'Last.fm kan valfritt skicka reklammejl då och då'
        }
    },
    email_language: {
        en: 'Email language',
        de: 'E-Mail-Sprache',
        pt: 'Idioma dos e-mails',
        sv: 'Mejlspråk'
    },
    communication: {
        en: 'Communication',
        de: 'Kommunikation',
        pt: 'Comunicação',
        sv: 'Kommunikation'
    },
    security: {
        en: 'Security',
        de: 'Sicherheit',
        pt: 'Segurança',
        sv: 'Sekretess'
    },
    logout_everywhere: {
        en: 'Logout on all devices',
        de: 'Auf allen Geräten abmelden',
        pt: 'Encerrar sessão em todos os dispositivos',
        sv: 'Logga ut från alla enheter'
    },
    delete_account: {
        name: {
            en: 'Delete account',
            de: 'Konto löschen',
            pt: 'Deletar conta',
            sv: 'Ta bort konto'
        },
        body: {
            en: 'Deletion will take 14 days to complete, after this time your account will either be deleted, anonymised, or put beyond use and cannot be recovered. Once deleted, your username will no longer be available.',
            de: 'Die Löschung dauert 14 Tage. Nach Ablauf dieser Frist wird dein Konto entweder gelöscht, anonymisiert, oder unbrauchbar gemacht und kann nicht wiederhergestellt werden. Nach der Löschung ist dein Benutzername nicht mehr verfügbar.',
            pt: 'A exclusão levará 14 dias para ser concluída. Após esse período, sua conta será excluída, anonimizada ou desativada, e não poderá ser recuperada. Depois de excluído, seu nome de usuário não estará mais disponível.',
            sv: 'Det tar 14 dagar att ta bort ditt konto. Efter denna tid blir dit konto antingen borttaget, anonymiserad, eller görs oanvändbar och kan inte fås tillbaka. När det är borttaget kan ditt användarnamn inte bli använt igen.'
        }
    },
    delete_account_permanently: {
        en: 'Delete {u} permanently',
        de: '{u} dauerhaft löschen',
        pt: 'Deletar {u} permanentemente',
        sv: 'Ta bort {u} permanent'
    },
    other: {
        // "other" section in settings
        en: 'Other',
        de: 'Sonstiges',
        pt: 'Outro',
        sv: 'Annat'
    },
    connect_app: {
        en: 'Connect {name}',
        de: 'Verbinde {name}',
        pt: 'Conectar {name}',
        sv: 'Anslut {name}'
    },
    connect: {
        en: 'Connect',
        de: 'Verbinden',
        pt: 'Conectar',
        sv: 'Anslut'
    },
    connected: {
        en: 'Connected',
        de: 'Verbunden',
        pt: 'Conectado',
        sv: 'Anslutit'
    },
    not_connected: {
        en: 'Not connected',
        de: 'Nicht verbunden',
        pt: 'Não conectado',
        sv: 'Inte ansluten'
    },
    api: {
        name: {
            en: 'Unlock additional API features',
            de: 'Schalte zusätzliche API-Funktionen frei',
            pt: 'Desbloqueie recursos adicionais da API',
            sv: 'Lås upp flera API-funktioner'
        },
        body: {
            en: 'Link your account to allow API access such as scrobbling',
            de: 'Verknüpfe dein Konto, um API-Zugriffe wie Scrobbling zu ermöglichen',
            pt: 'Conecte sua conta para permitir o acesso à API, como o scrobbling',
            sv: 'Koppla ditt konto för att tillåta API-åtkomster, som att skrobbla'
        },
        short: {
            en: 'API'
        }
    },
    api_status: {
        en: 'API status',
        de: 'API-Status',
        pt: 'Status da API',
        sv: 'API-status'
    },
    app_would_like_to_connect: {
        // app name is above
        en: 'would like to use your account',
        de: 'möchte sich mit deinem Konto verbinden',
        pt: 'gostaria de usar sua conta',
        sv: 'vill använda ditt konto'
    },
    logged_in_as: {
        en: 'Logged in as {user}',
        de: 'Angemeldet als {user}',
        pt: 'Conectado como {user}',
        sv: 'Loggat in som {user}'
    },
    not_logged_in: {
        en: 'Not logged in',
        de: 'Nicht angemeldet',
        pt: 'Não conectado',
        sv: 'Inte inloggad'
    },
    ensure_you_trust: {
        // API applications
        // last.fm/settings/applications
        en: 'Make sure you trust this application',
        de: 'Stelle sicher, dass du dieser Anwendung vertraust',
        pt: 'Certifique-se de que você confia neste aplicativo',
        sv: 'Var säker på att du litar denna applikation'
    },
    has_been_connected: {
        // app name is above
        en: 'has been connected',
        de: 'wurde verbunden',
        pt: 'foi conectado',
        sv: 'har anslutits'
    },
    you_can_now_close_this_tab: {
        en: 'You can now close this tab',
        de: 'Du kannst diesen Tab jetzt schließen',
        pt: 'Você pode fechar esta aba agora',
        sv: 'Du kan nu stänga den här fliken'
    },
    manage_applications: {
        // API applications
        // last.fm/settings/applications
        en: 'Manage applications',
        de: 'Anwendungen verwalten',
        pt: 'Gerenciar aplicações',
        sv: 'Hantera applikationer'
    },
    markdown_profiles: {
        name: {
            en: 'Use fancy formatting on profiles',
            de: 'Verwende schönere Formatierungen für Profile',
            pt: 'Usar formatação estilosa nos perfis',
            sv: 'Använd snygg formatering på profiler'
        },
        body: {
            en: 'Allows the use of line breaks, bold text, italics, and images in all “About Me” panels',
            de: 'Ermöglicht die Verwendung von Zeilenumbrüchen, fettem Text, Kursivschrift und Bildern in allen „Über mich“-Bereichen',
            pt: 'Permite o uso de quebras de linha, texto em negrito, itálico e imagens em todos os painéis “Sobre mim”',
            sv: 'Tillåter radbrytning, fet stil, kursiv stil, och bilder inom alla “Om mig”-paneler'
        }
    },
    markdown_shouts: {
        name: {
            en: 'Use fancy formatting on shouts',
            de: 'Verwende schönere Formatierungen für Shouts',
            pt: 'Usar formatação estilosa nas caixas de mensagens',
            sv: 'Använd snygg formatering på hojtningar'
        },
        body: {
            en: 'Allows the use of line breaks, bold text, italics, and images in all shouts',
            de: 'Ermöglicht die Verwendung von Zeilenumbrüchen, fettem Text, Kursivschrift und Bildern in allen Shouts',
            pt: 'Permite o uso de quebras de linha, texto em negrito, itálico e imagens em todas as caixas de mensagens',
            sv: 'Tillåter radbrytning, fet stil, kursiv stil, och bilder inom alla hojtningar'
        },
        preview: {
            en: 'hello! **hello!** *hello!*\n[here’s a link](https://katelyn.moe) HAII @evangelicgirl',
            de: 'hallo! **hallo!** *hallo!*\n[hier ist ein link](https://katelyn.moe) HALLÖCHEN @evangelicgirl',
            pt: 'oi! **olá!** *opa!*\n[aqui está um link](https://katelyn.moe) OIEE @evangelicgirl',
            sv: 'hej! **hej!** *hej!*\n[här är en länk](https://katelyn.moe) HEJJ @evangelicgirl'
        }
    },
    gathering_your_plays: {
        en: 'Gathering your album plays',
        de: 'Sammeln deiner Albumwiedergaben',
        pt: 'Coletando suas reproduções de álbuns',
        sv: 'Samlar dina albumspelningar'
    },
    failed_to_find_tracks: {
        en: 'You do not have any plays',
        de: 'Du hast keine Plays',
        pt: 'Você não tem nenhuma reprodução',
        sv: 'Du har inga spelningar'
    },
    sourced_from_own_plays: {
        // tracklist from your own album plays
        en: 'Sourced from your own plays as an official tracklist is unavailable',
        de: 'Diese Liste basiert auf deinen eigenen Plays, da keine offizielle Titelliste verfügbar ist',
        pt: 'Baseado nas suas próprias reproduções, pois a tracklist oficial não está disponível',
        sv: 'Hämtas från dina egna spelningar för en officiell spellista finns inte'
    },
    submit_language: {
        name: {
            en: 'Are you fluent in a supported language?',
            de: 'Sprichst du eine der unterstützten Sprachen fließend?',
            pt: 'Você é fluente em algum dos idiomas suportados?',
            sv: 'Talar du ett språk som stöds flytande?'
        },
        body: {
            en: 'Translations are powered by community contributions from wonderful people like you',
            de: 'Übersetzungen werden durch Beiträge der Community von wunderbaren Menschen wie dir ermöglicht',
            pt: 'As traduções são feitas graças às contribuições da comunidade de pessoas incríveis como você',
            sv: 'Översättningar drivs av bidrag från underbara folk som du'
        }
    },
    welcome_to_bleh: {
        // <br> is a line break
        en: 'Welcome to bleh, thank you for installing!<br>You can continue through this quick setup to get you started or skip right to your profile and figure it all out yourself <3',
        de: 'Willkommen bei bleh, danke für die Installation!<br>Du kannst diesen schnellen Einrichtungsassistenten durchlaufen, um loszulegen, oder direkt zu deinem Profil springen und alles selbst herausfinden <3',
        pt: 'Bem-vindo ao bleh, obrigado por instalar!<br>Você pode seguir este rápido guia de configuração para começar, ou pular direto para seu perfil e descobrir tudo por conta própria <3',
        sv: 'Välkommen till bleh, tack för att du har installerat!<br>Du kan fortsätta genom den här snabba setupen för att starta eller hoppa rakt till din profil och klura ut det helt själv <3'
    },
    next: {
        en: 'Next',
        de: 'Weiter',
        pt: 'Próximo',
        sv: 'Nästa'
    },
    choose_a_theme: {
        en: 'Choose a theme that suits you best!',
        de: 'Wähle ein Farbschema, das am besten zu dir passt!',
        pt: 'Escolha o tema que mais combina com você',
        sv: 'Välj ett tema som passar dig bäst!'
    },
    accessibility_explain: {
        en: 'Before we continue, let’s assess your accessibility settings.',
        de: 'Lass uns kurz deine Barrierefreiheitseinstellungen überprüfen, bevor wir weitermachen.',
        pt: 'Antes de continuarmos, vamos acessar suas configurações de acessibilidade',
        sv: 'Innan vi fortsätter ska vi kontrollera dina tillgänglighetsinställningar.'
    },
    colours_explain: {
        en: 'Choose a colour you like or make your own favourite.',
        de: 'Wähle eine Farbe, die dir gefällt, oder lege deine eigene Lieblingsfarbe fest.',
        pt: 'Escolha uma cor que você goste ou crie a sua favorita.',
        sv: 'Välj en färg du tycker om eller gör din egna favorit.'
    },
    music_explain: {
        en: 'We offer a variety of options to help you manage your music library.',
        de: 'Wir bieten eine Vielzahl von Optionen, um dir bei der Verwaltung deiner Musikbibliothek zu helfen.',
        pt: 'Nós oferecemos uma variedade de opções para ajudar você a gerenciar sua biblioteca musical.',
        sv: 'Vi har massa olika inställningar för att hjälpa till att ordna ditt musikbibliotek.'
    },
    setup_end: {
        en: 'That’s all for now, to configure your bleh installation in the future head to {a}the settings{/a} in your menu!',
        de: 'Das war’s fürs Erste. Um deine bleh-Installation in Zukunft zu konfigurieren, gehe zu {a}den Einstellungen{/a} in deinem Menü!',
        pt: 'Por enquanto isso é tudo, para configurar sua instalação do bleh futuramente, vá até {a}nas configurações{/a} no seu menu!',
        sv: 'Det var allt just nu, för att konfigurera din bleh-installation i framtiden gå in på {a}inställningarna{/a} i menyn!'
    },
    seasonal_particles: {
        name: {
            en: 'Show particles during select seasons',
            de: 'Partikel während ausgewählter Jahreszeiten anzeigen',
            pt: 'Mostrar particulas durante estações selecionadas',
            sv: 'Visa partiklar under vissa årstider'
        },
        body: {
            en: 'During colder seasons, watch pretty snowflakes fall ⋆⁺₊❅。',
            de: 'Während der kälteren Jahreszeiten kannst du hübsche Schneeflocken fallen sehen ⋆⁺₊❅。',
            pt: 'Durante as sessões de inverno, veja flocos de neve bonitinhos caindo ⋆⁺₊❅。',
            sv: 'Under kyligare årstider, se vackra snöflingorna glida sakta ner ⋆⁺₊❅。'
        }
    },
    all_particles: {
        en: 'Show full particles',
        de: 'Alle Partikel anzeigen',
        pt: 'Mostrar todas as partículas',
        sv: 'Visa fulla partiklar'
    },
    less_particles: {
        en: 'Show less particles',
        de: 'Weniger Partikel anzeigen',
        pt: 'Mostrar menos partículas',
        sv: 'Visa mindre partiklar'
    },
    no_particles: {
        en: 'Disable particles',
        de: 'Partikel deaktivieren',
        pt: 'Desativar partículas',
        sv: 'Stäng av partiklar'
    },
    going: {
        // going as in going to an event
        en: 'Going',
        de: 'Zugesagt',
        pt: 'Indo',
        sv: 'Ska gå på'
    },
    beware_notice: {
        en: 'Beware! Only change these settings if you know what you’re doing',
        de: 'Vorsicht! Ändere diese Einstellungen nur, wenn du weißt, was du tust',
        pt: 'Cuidado! Apenas mude estas configurações se você sabe o que você está fazendo',
        sv: 'Var försiktig! Ändra bara dessa inställningar om du vet vad du gör'
    },
    force_refresh_style: {
        name: {
            en: 'Force re-download styles',
            de: 'Erneutes Herunterladen von Stylesheets erzwingen',
            pt: 'Forçar o re-download dos estilos',
            sv: 'Tvinga omladdning av stiler'
        },
        body: {
            en: 'Deletes your current cache of the bleh stylesheet and retrieves the latest',
            de: 'Löscht deinen aktuellen Cache des bleh-Stylesheets und lädt die neueste Version herunter',
            pt: 'Exclui o cache atual da folha de estilo do bleh e recupera a versão mais recente',
            sv: 'Tar bort din nuvarande cache av bleh-stil och hämtar hem den senaste'
        }
    },
    intended_for_development: {
        name: {
            en: 'This page is intended for development',
            de: 'Diese Seite ist für die Entwicklung gedacht',
            sv: 'Denna sida är avsedd för utveckling'
        },
        body: {
            en: 'Be careful with options here (especially feature flags) as they can break your install.',
            de: 'Sei vorsichtig mit diesen Einstellungen (besonders mit den Feature Flags), da sie deine Installation beschädigen können.',
            pt: 'Tenha cuidado com as opções aqui (especialmente com os flags de recursos), pois elas podem causar problemas na sua instalação.',
            sv: 'Var försiktig med inställningarna här (speciellt funktionsflaggor) eftersom dom kan förstöra din installation.'
        }
    },
    flags: {
        // shorthand for below
        en: 'Flags',
        de: 'Flags',
        sv: 'Flaggor'
    },
    manage_feature_flags: {
        // feature flags control features (like an option)
        en: 'Manage feature flags',
        de: 'Feature Flags verwalten',
        pt: 'Gerenciar flags de recursos',
        sv: 'Hantera funktionsflaggor'
    },
    development: {
        en: 'Development',
        de: 'Entwicklung',
        pt: 'Desenvolvimento',
        sv: 'Utveckling'
    },
    this_section_requires_password: {
        en: 'This section requires a password to view',
        de: 'Dieser Bereich benötigt ein Passwort zum Ansehen',
        pt: 'Esta seção requer uma senha para ser visualizada',
        sv: 'Denna avdelning behöver ett lösenord för att se'
    },
    enter_password: {
        en: 'Enter password',
        de: 'Passwort eingeben',
        pt: 'Digite a senha',
        sv: 'Skriv in lösenord'
    },
    unlocked: {
        en: 'Unlocked',
        de: 'Freigeschaltet',
        pt: 'Desbloqueado',
        sv: 'Upplåst'
    },
    privacy: {
        en: 'Privacy',
        de: 'Datenschutz',
        pl: 'Prywatność',
        pt: 'Privacidade',
        sv: 'Sekretess'
    },
    recent_listening: {
        name: {
            en: 'Hide your recent listening history',
            de: 'Deine zuletzt gehörten Titel ausblenden',
            pt: 'Ocultar seu histórico de scrobbles recente',
            sv: 'Göm senaste lyssnarinformationen'
        },
        body: {
            en: 'Keeps your activity more private',
            de: 'Gibt deiner Aktivität mehr Privatsphäre',
            pt: 'Mantém sua atividade mais privada',
            sv: 'Håller din aktivitet mer privat'
        }
    },
    allow_messages_from: {
        en: 'Allow messages from',
        de: 'Erlaube Nachrichten von',
        pt: 'Permitir mensagens de',
        sv: 'Tillåt meddelanden ifrån'
    },
    everyone: {
        en: 'Everyone',
        de: 'Jedem',
        pt: 'Todo mundo',
        sv: 'Alla'
    },
    following_and_neighbours: {
        en: 'Following and neighbours',
        de: 'Nachbarn und Leuten, denen du folgst',
        pt: 'Seguindo e vizinhos',
        sv: 'Följare och grannar'
    },
    close_shouts: {
        name: {
            en: 'Close my shoutbox',
            de: 'Meine Shoutbox schließen',
            pt: 'Fechar minha caixa de mensagens',
            sv: 'Stäng min hojtlåda'
        },
        body: {
            en: 'Removes visibility from everyone (including you)',
            de: 'Blendet deine Shoutbox für alle Beutzer aus (einschließlich dir)',
            pt: 'Remove a visibilidade de todos (incluindo você)',
            sv: 'Ta bort synlighet från alla (inkl. dig)'
        }
    },
    error: {
        en: 'Error',
        de: 'Fehler',
        pt: 'Erro',
        sv: 'Error'
    },
    erm: {
        // used when a page is taken down
        en: 'erm...',
        de: 'ähm...',
        pt: 'puts...',
        sv: 'ehm...'
    },
    shortcut: {
        en: 'Shortcut',
        de: 'Verknüpfung',
        pt: 'Atalho',
        sv: 'Genomväg'
    },
    last_count_days: {
        en: 'Last {c} days',
        de: 'Letzte {c} Tage',
        pt: 'Últimos {c} dias',
        ja: '過去 {c} 日間',
        sv: 'Senaste {c} dagarna'
    },
    all_time: {
        en: 'All time',
        de: 'Insgesamt',
        pt: 'Todo o período',
        ja: 'すべての期間',
        sv: 'All tid'
    },
    choose_a_timeframe_above: {
        en: 'Choose a timeframe above',
        de: 'Wähle oben einen Zeitraum',
        pt: 'Escolha um prazo acima',
        sv: 'Välj en tidsram ovan'
    },
    failed: {
        en: 'Failed',
        de: 'Fehlgeschlagen',
        pt: 'Falhou',
        sv: 'Misslyckades'
    },
    there_was_a_network_error: {
        en: 'There was a network error',
        de: 'Netzwerkfehler',
        pt: 'Ocorreu um erro de rede',
        sv: 'Ett nätverksfel har inträffat'
    },
    support: {
        en: 'Support',
        de: 'Support',
        pt: 'Suporte',
        sv: 'Support'
    },
    no_plays_in_range: {
        // no plays in date range
        en: 'No plays in this range',
        de: 'Keine Plays in diesem Zeitraum',
        sv: 'Inga lyssningar under valda datumintervallet'
    },
    accessible_name_colours: {
        name: {
            en: 'Prefer accessible name colours',
            de: 'Bevorzuge gut lesbare Namensfarben',
            pt: 'Preferir nomes de cores acessíveis',
            sv: 'Föredra lättlästa namnfärger'
        },
        body: {
            en: 'Replaces badge and link-coloured names with your theme’s header colour',
            de: 'Ersetzt Abzeichen- und Linkfarben mit der Kopfzeilenfarbe deines Farbschemas',
            pt: 'Substitui os nomes coloridos dos emblemas e links pela cor do cabeçalho do seu tema',
            sv: 'Ersätter emblem och länkfärgade namn med ditt temas rubrikfärg'
        }
    },
    underline_links: {
        name: {
            en: 'Always underline links',
            de: 'Links immer unterstreichen',
            pt: 'Sempre sublinhe os links',
            sv: 'Ha alltid understrykta länkar'
        },
        body: {
            en: 'Forces buttons, links, and other interactables to have an underline',
            de: 'Erzwingt, dass Schaltflächen, Links und andere interaktive Elemente unterstrichen sind',
            pt: 'Força botões, links e outros interativos a terem um sublinhado',
            sv: 'Tvingar knappar, länkar och andra interaktiva objekt att ha understrykt text'
        }
    },
    theme_loading: {
        name: {
            en: 'Disable loading of styles',
            de: 'Deaktiviere das Laden von Stylesheets',
            pt: 'Desative o carregamento de estilos',
            sv: 'Avaktivera att ladda stilar'
        },
        body: {
            en: 'Allows you to load the stylesheet yourself during development',
            de: 'Ermöglicht es dir, das Stylesheet während der Entwicklung selbst zu laden',
            pt: 'Permite que você mesmo carregue a folha de estilo enquanto desenvolve',
            sv: 'Låter dig ladda stilschemat själv under utveckling'
        }
    },
    upload: {
        en: 'Upload',
        de: 'Hochladen',
        pt: 'Enviar',
        sv: 'Ladda upp'
    },
    upload_image: {
        en: 'Upload image',
        de: 'Bild hochladen',
        sv: 'Ladda upp bild'
    },
    image_details: {
        en: 'Image details',
        de: 'Bildinformationen',
        sv: 'Bildinformation'
    },
    title: {
        en: 'Title',
        de: 'Titel',
        sv: 'Titel'
    },
    description: {
        en: 'Description',
        de: 'Beschreibung',
        sv: 'Beskrivning'
    },
    change_avatar: {
        en: 'Change avatar',
        de: 'Profilbild ändern',
        pt: 'Mudar foto de perfil',
        sv: 'Ändra profilbild'
    },
    crop_avatar: {
        en: 'Crop avatar',
        de: 'Profilbild zuschneiden',
        pt: 'Recortar avatar',
        sv: 'Beskär profilbild'
    },
    crop_notice: {
        en: 'Use your scroll wheel to zoom in and out, click and drag to move the image.',
        de: 'Verwende dein Mausrad, um rein- und rauszuzoomen. Klicke und ziehe, um das Bild zu verschieben.',
        pt: 'Use a scroll do seu mouse para dar zoom in e zoom out, clicar e arrastar para mover a imagem.',
        sv: 'Använd ditt scrollhjul för att zooma in och ut, klicka och dra för att flytta på bilden.'
    },
    edit_profile_note: {
        en: 'Edit profile note',
        de: 'Profilnotiz bearbeiten',
        pt: 'Editar recado de perfil',
        sv: 'Ändra profilanteckning'
    },
    update_to_version: {
        en: 'Update to {v}',
        de: 'Auf {v} aktualisieren',
        pt: 'Atualizar para {v}',
        sv: 'Uppdatera till {v}'
    },
    all: {
        // all photos
        en: 'All',
        de: 'Alle',
        pt: 'Todos',
        sv: 'Visa alla'
    },
    saved: {
        // saved/bookmarked photos
        en: 'Saved',
        de: 'Gespeichert',
        pt: 'Salvo',
        sv: 'Sparade'
    },
    no_images_saved: {
        en: 'No photos saved',
        de: 'Keine Bilder gespeichert',
        pt: 'Nenhuma foto salva',
        sv: 'Inga foton sparade'
    },
    interested: {
        en: 'Interested',
        de: 'Interessiert',
        pt: 'Interessado',
        sv: 'Intresserad'
    },
    total: {
        en: 'Total',
        de: 'Gesamt',
        sv: 'Totalt'
    },
    value_failed_to_load: {
        en: '{v} failed to load',
        de: '{v} konnte nicht geladen werden',
        pt: '{v} falhou ao carregar',
        sv: '{v} kunde inte laddas'
    },
    profile_does_not_have_enough_scrobbles: {
        en: 'Profile does not have enough scrobbles',
        de: 'Profil hat nicht genügend Scrobbles',
        pt: 'O perfil não tem scrobbles o suficiente',
        sv: 'Profilen har inte tillräckligt med skrobblingar'
    },
    requires_extension_value: {
        en: 'Requires extension ‘{v}’',
        de: 'Benötigt die Erweiterung „{v}“',
        pt: 'Requer extensão ‘{v}’',
        sv: 'Behöver tillägget ‘{v}’'
    },
    incompatible_with_value: {
        en: 'Incompatible with {v}',
        de: 'Inkompatibel mit {v}',
        pt: 'Incompatível com {v}',
        sv: 'Inkompatibelt med {v}'
    },
    incompatible_alert: {
        en: 'Incompatible with current settings',
        de: 'Nicht mit den aktuellen Einstellungen kompatibel',
        sv: 'Inkompatibelt med nuvarande inställningar'
    },
    bulk_edit_extension: {
        en: 'Last.fm Bulk Edit',
        de: 'Last.fm-Massenbearbeitung',
        pt: 'Edição em massa do Last.fm',
        sv: 'Last.fm bulkredigering'
    },
    collage: {
        en: 'Collage',
        de: 'Collage',
        pt: 'Colagem',
        sv: 'Collage'
    },
    collage_redirect: {
        en: 'Redirected to bleh’s built-in Collage feature',
        de: 'Weiterleitung zur integrierten Collagenfunktion von bleh',
        pt: 'Redirecionando ao recurso integrado de Colagem do bleh',
        sv: 'Omredigerad till blehs egna collagefunktion'
    },
    your_collage_is_ready: {
        en: 'Your collage is ready!',
        de: 'Deine Collage ist fertig!',
        pt: 'Sua colagem está pronta!',
        sv: 'Ditt collage är redo'
    },
    name_failed: {
        en: '{name} failed',
        de: '{name} fehlgeschlagen',
        pt: '{name} falhou',
        sv: '{name} misslyckades'
    },
    select_component: {
        // the 'Select' component (like a dropdown menu)
        // not an option to chooose your component
        en: 'Select component',
        de: 'Auswahlkomponente',
        pt: 'Selecionar componente',
        sv: 'Välj komponent'
    },
    only_numbers_are_allowed: {
        en: 'Only numbers are allowed here',
        de: 'Nur Zahlen sind erlaubt',
        pt: 'Apenas números são permitidos aqui',
        sv: 'Endast nummer är tillåtna här'
    },
    keep_within_the_range: {
        // if the user wrote more text than the text box allows
        en: 'Keep within the range',
        de: 'Bleibe innerhalb des Zeichenlimits',
        pt: 'Manter dentro do intervalo',
        sv: 'Håll dig inom gränsen'
    },
    this_field_is_required: {
        // field as in a text box
        en: 'This field is required',
        de: 'Dieses Feld ist erforderlich',
        pt: 'Este campo é obrigatório',
        sv: 'Fältet krävs'
    },
    please_dont_clone_yourself: {
        en: 'Please don’t clone yourself',
        de: 'Bitte klone dich nicht selbst',
        pt: 'Por favor, não se clone',
        sv: 'Snälla, klona inte dig själv'
    },
    generate: {
        en: 'Generate',
        de: 'Generieren',
        pt: 'Gerar',
        sv: 'Generera'
    },
    your_settings_are_invalid: {
        en: 'Your settings are invalid',
        de: 'Deine Einstellungen sind ungültig',
        pt: 'Suas configurações são inválidas',
        sv: 'Dina inställningar är ogiltiga'
    },
    top_type: {
        en: 'Top {type}',
        de: 'Top-{type}',
        sv: 'Topp{type}'
    },
    download: {
        en: 'Download',
        de: 'Herunterladen',
        pt: 'Baixar',
        sv: 'Ladda ned'
    },
    downloaded: {
        en: 'Downloaded',
        de: 'Heruntergeladen',
        pt: 'Baixado',
        sv: 'Nedladdat'
    },
    are_you_sure: {
        en: 'Are you sure?',
        de: 'Bist du sicher?',
        pt: 'Você tem certeza?',
        sv: 'Är du säker'
    },
    this_will_require_loading_count_pages: {
        en: 'This will require loading {c} pages',
        de: 'Dies erfordert das Laden von {c} Seiten',
        pt: 'Isso requer carregar {c} páginas',
        sv: 'Det här kräver att {c} sidor laddas'
    },
    chart_template_filename: {
        en: '{user} Collage ({timeframe}, Top {type}, {size}) - {brand} {date}',
        de: '{user} Collage ({timeframe}, Top-{type}, {size}) - {brand} {date}',
        pt: '{user} Colagem ({timeframe}, Top {type}, {size}) - {brand} {date}',
        sv: '{user} Collage ({timeframe}, Topp{type}, {size}) - {brand} {date}'
    },
    waiting_for_images: {
        en: 'Waiting for images',
        pt: 'Aguardando imagens',
        sv: 'Väntar på bilder'
    },
    collage_title: {
        name: {
            en: 'Collage title',
            de: 'Collagentitel',
            pt: 'Título da colagem',
            sv: 'Collagetitel'
        },
        body: {
            en: 'Include a subtle header showing your username and settings you used',
            de: 'Fügt eine dezente Kopfzeile hinzu, die deinen Benutzernamen und die von dir gewählten Einstellungen anzeigt',
            pt: 'Inclua um cabeçalho discreto mostrando seu nome de usuário e as configurações que você usou',
            sv: 'Lägger till en liten rubrik som visar ditt användarnamn och dina inställningar'
        }
    },
    collage_grid_text: {
        en: 'Show names on grid items',
        de: 'Namen auf Rasterobjekten anzeigen',
        pt: 'Mostrar nomes nos itens da grade',
        sv: 'Visa namn på collageobjekt'
    },
    collage_grid_plays: {
        en: 'Show plays on grid items',
        de: 'Plays auf Rasterobjekten anzeigen',
        pt: 'Mostrar reproduções nos itens da grade',
        sv: 'Visa spelningar på collageobjekt'
    },
    collage_grid_gap: {
        name: {
            en: 'Leave a gap between grid items',
            de: 'Abstand zwischen Rasterobjekten',
            pt: 'Deixe um espaço entre os itens da grade',
            sv: 'Lämna rum mellan collageobjekt'
        },
        body: {
            en: 'Includes outer and inner padding with round grid items',
            de: 'Fügt äußere und innere Abstände sowie abgerundete Rasterobjekte hinzu',
            sv: 'Lägger till inre och yttre mellanrum med avrundade collageobjekt'
        }
    },
    collage_centered: {
        name: {
            en: 'Center info on grid items',
            de: 'Informationen auf Rasterobjekten zentrieren',
            sv: 'Centrera informationen på collageobjekt'
        },
        body: {
            en: 'Similar to the look of other collage solutions',
            de: 'Ähnlicher Stil wie andere Collagenlösungen',
            sv: 'Mer lik till hur andra collagegenererare gör det'
        }
    },
    organising_plays: {
        en: 'Organising plays',
        de: 'Plays werden organisiert',
        pt: 'Organizando reproduções',
        sv: 'Organisera spelningar'
    },
    update_now: {
        en: 'Update now',
        de: 'Jetzt aktualisieren',
        pt: 'Atualizar agora',
        sv: 'Uppdatera nu'
    },
    ignore_for_now: {
        en: 'Ignore for now',
        de: 'Vorerst ignorieren',
        pt: 'Ignore por agora',
        sv: 'Ignorera just nu'
    },
    update_styles: {
        en: 'Update styles',
        de: 'Stylesheets aktualisieren',
        pt: 'Atualizar estilos',
        sv: 'Uppdatera stiler'
    },
    downloading_styles: {
        en: 'Downloading styles',
        de: 'Lade Stylesheets herunter',
        pt: 'Baixando estilos',
        sv: 'Laddar ner stiler'
    },
    style_warning: {
        en: 'You have style loading off! If you did this by accident, you can undo this',
        de: 'Du hast das Laden von Stylesheets deaktiviert! Wenn du das aus Versehen gemacht hast, kannst du es rückgängig machen',
        pt: 'Você desativou o carregamento de estilos! Se você fez isso acidentalmente, pode desfazer essa ação',
        sv: 'Du har stängt av att stiler laddas! Om du gjorde det av misstag så kan du återställa det'
    },
    re_enable_style_loading: {
        en: 'Re-enable style loading',
        pt: 'Reativar carregamento de estilos',
        sv: 'Återaktivera att stiler laddas'
    },
    made_with_love: {
        // lowercase in design
        en: 'made with {h} by {u} and {c}contributors{/c}',
        de: 'mit {h} gemacht von {u} und {c}mitwirkenden{/c}',
        pt: 'feito com {h} por {u} e {c}contribuidores{/c}',
        sv: 'skapad med {h} av {u} och {c}bidragsgivare{/c}'
    },
    love_lower: {
        // replaces the {h} in the above sentence
        // lowercase in design
        en: 'love',
        de: 'liebe',
        pt: 'amor',
        sv: 'kärlek'
    },
    view_source: {
        en: 'View source',
        de: 'Quellcode ansehen',
        pt: 'Ver código',
        sv: 'Visa källa'
    },
    report_issue: {
        en: 'Report issue',
        de: 'Problem melden',
        pt: 'Relatar problema',
        sv: 'Rapportera problem'
    },
    opens_your_value_settings: {
        // DE: is this used both for profile settings and bleh settings in the quick switcher? ~Myrai
        // Profile Settings would be {v}einstellungen, bleh Settings would be {v}-Einstellungen
        en: 'Open your {v} settings',
        de: 'Öffne deine {v}-Einstellungen',
        pt: 'Abra suas opções de {v}',
        sv: 'Öppna dina {v}-inställningar'
    },
    opens_your_value: {
        // DE: depending on the word in {v}, this might be "dein", "deine" or the inclusive "dein:e" ~Myrai
        // DEIN Profil, DEIN:E markierte Freund:in, DEINE Benachrichtigungen, DEINE Nachrichten, DEINE Minis, DEINE Profileinstellungen
        en: 'Open your {v}',
        de: 'Öffne dein {v}',
        pt: 'Abra seu {v}',
        sv: 'Öpnna dina {v}'
    },
    opens_the_value: {
        // DE: same here, depends on context ~Myrai
        // currently, it's all "die" – DIE Farbschemenauswahl, DIE Minis, DIE Neuigkeiten, DIE bleh-Einstellungen
        en: 'Open the {v}',
        de: 'Öffne die {v}',
        pt: 'Abra o {v}',
        sv: 'Öppna {v}'
    },
    theme_picker: {
        en: 'Theme picker',
        de: 'Farbschemenauswahl',
        pt: 'Seletor de temas',
        sv: 'Temaväljare'
    },
    changes_your_theme: {
        en: 'Changes your theme',
        de: 'Ändert dein Farbschema',
        pt: 'Mude seu tema',
        sv: 'Ändrar ditt tema'
    },
    on_this_page: {
        en: 'On this page',
        de: 'Auf dieser Seite',
        pt: 'Nessa página',
        sv: 'På denna sida'
    },
    use_current_page_as_context: {
        en: 'Use current page as context',
        de: 'Aktuelle Seite als Kontext verwenden',
        pt: 'Usar a página atual como contexto',
        sv: 'Använd aktuella sidan som referens'
    },
    opens_the_value_for_type: {
        en: 'Open the {v} for {t}',
        de: 'Öffne das {v} für {t}',
        pt: 'Abra a {v} para {t}',
        sv: 'Öpnnar {v] för {t}'
    },
    quick_switcher: {
        en: 'Rabbit hole',
        de: 'Quick Switcher',
        sv: 'Genvägar'
    },
    use_quick_switcher: {
        name: {
            en: 'Enable the quick switcher',
            de: 'Quick Switcher aktivieren',
            sv: 'Aktivera snabbväxlare'
        },
        body: {
            en: 'Make full use of your keyboard to navigate exactly where you want to be',
            de: 'Nutze deine Tastatur, um genau dorthin zu navigieren, wo du hinmöchtest',
            sv: 'Gör full användning av ditt tangentbord för att navigera till precis vart du vill vara'
        }
    },
    quick_switcher_keybinds: {
        en: 'Change keybinds',
        de: 'Tastenkombinationen ändern',
        sv: 'Ändra tangentbordsgenvägar'
    },
    switch_placeholder: {
        en: 'Quick switch to a page or action',
        de: 'Schnell zu einer Seite oder Aktion wechseln',
        pt: 'Alternar rapidamente para uma página ou ação',
        sv: 'Hoppa snabbt till en sida eller annan åtgärd'
    },
    rabbit_search: {
        en: 'Enter {v} name',
        de: 'Gebe den Namen des {v}s ein',
        sv: 'Skriv {v}namn'
    },
    compares_your_taste: {
        en: 'Compare your taste with {v}',
        de: 'Vergleiche deinen Musikgeschmack mit {v}',
        pt: 'Compare o seu gosto com {v}',
        sv: 'Jämför musiksmak med {v}'
    },
    select_an_option: {
        en: 'Select an option',
        de: 'Wähle eine Option',
        pt: 'Selecione uma opção',
        sv: 'Välj ett alternativ'
    },
    nothing_matches_your_search: {
        en: 'Nothing matches your search',
        de: 'Es wurde nichts zu deiner Suche gefunden',
        pt: 'Nada corresponde à sua pesquisa',
        sv: 'Inga resultat matchar din sökning'
    },
    create_a_collage: {
        en: 'Create a collage of your choosing',
        de: 'Erstelle eine Collage deiner Wahl',
        pt: 'Crie uma colagem de sua escolha',
        sv: 'Skapa ett collage som du vill'
    },
    search_for_music_or_user: {
        en: 'Search for music or a user',
        de: 'Suche nach Musik oder einem Benutzer',
        pt: 'Pesquise por música ou usuário',
        sv: 'Sök musik eller en användare'
    },
    search_for_value: {
        en: 'Search for {v}',
        de: 'Nach {v} suchen',
        pt: 'Pesquise por {v}',
        sv: 'Sök upp {v}'
    },
    choose_a_search_type: {
        en: 'Choose a search type',
        de: 'Wähle einen Suchtyp',
        pt: 'Escolha um tipo de pesquisa',
        sv: 'Välj söktyp'
    },
    finish_search: {
        en: 'Finish your search',
        de: 'Beende deine Suche',
        pt: 'Finalize sua pesquisa',
        sv: 'Finalisera sökning'
    },
    view_count_more: {
        en: 'View {c} more',
        de: '{c} weitere anzeigen',
        sv: 'Visa {v} fler'
    },
    saved_to_bookmarks: {
        en: 'Saved to bookmarks',
        de: 'Lesezeichen hinzugefügt',
        pt: 'Salvo nos marcadores',
        sv: 'Sparad till dina bokmärken'
    },
    bookmark_save_msg: {
        en: 'Find your bookmarks in your Home or {link}',
        de: 'Finde deine Lesezeichen auf deiner Startseite oder {link}',
        pt: 'Encontre seus marcadores na sua página inicial ou em {link}',
        sv: 'Hitta dina bokmärken på startsidan eller {link}'
    },
    go_there_now_lower: {
        // in sentence above
        en: 'go there now',
        de: 'schaue sie dir direkt an',
        pt: 'vai lá agora',
        sv: 'gå dit nu'
    },
    always_remind_me: {
        en: 'Always remind me',
        de: 'Erinnere mich immer',
        sv: 'Påminn mig alltid'
    },
    never: {
        en: 'Never',
        de: 'Nie',
        sv: 'Aldrig'
    },
    edit_scrobble: {
        en: 'Edit scrobble',
        de: 'Scrobble bearbeiten',
        pt: 'Editar scrobble',
        sv: 'Redigera skrobbel'
    },
    edit_scrobbles_in_bulk: {
        en: 'Edit scrobbles in bulk',
        de: 'Mehrere Scrobbles bearbeiten',
        pt: 'Editar scrobbles em massa',
        sv: 'Massredigera skrobblingar'
    },
    timeline: {
        en: 'Timeline',
        de: 'Zeitstrahl',
        sv: 'Tidslinje'
    },
    view_latest: {
        en: 'View latest',
        de: 'Neueste anzeigen',
        sv: 'Visa senaste'
    },
    custom: {
        en: 'Custom',
        de: 'Benutzerdefiniert',
        sv: 'Anpassad'
    },
    star: {
        en: 'Star',
        de: 'Markieren',
        sv: 'Stjärna'
    },
    starred: {
        en: 'Starred',
        de: 'Markiert',
        sv: 'Stjärnmärkt'
    },
    report: {
        en: 'Report',
        de: 'Melden',
        pt: 'Reportar',
        sv: 'Anmäl'
    },
    auto: {
        en: 'Auto',
        de: 'Automatisch',
        sv: 'Automatiskt'
    },
    glass: {
        en: 'Glass',
        de: 'Glas',
        sv: 'Glas'
    },
    high_contrast: {
        en: 'Prefer high contrast',
        de: 'Hohen Kontrast bevorzugen',
        sv: 'Föredra högkontrast'
    },
    external: {
        en: 'External',
        de: 'Extern',
        sv: 'Extern'
    },
    watch: {
        en: 'Watch',
        de: 'Ansehen',
        sv: 'Se'
    },
    watch_video: {
        en: 'Watch video',
        de: 'Video ansehen',
        sv: 'Se video'
    },
    latest_album: {
        en: 'Latest album',
        de: 'Neuestes Album',
        sv: 'Senaste album'
    },
    popular_now: {
        en: 'Popular now',
        de: 'Zurzeit beliebt',
        sv: 'Populär just nu'
    },
    missing_album_info: {
        en: 'This album is missing key details, maybe you can help out?',
        de: 'Diesem Album fehlen wichtige Details, vielleicht kannst du helfen?'
    },
    updates: {
        en: 'Updates',
        de: 'Updates',
        pt: 'Atualizações',
        sv: 'Uppdateringar'
    },
    updated: {
        en: 'Updated',
        de: 'Aktualisiert',
        pt: 'Atualizado',
        sv: 'Uppdaterats'
    },
    you_are_up_to_date: {
        en: 'You’re up to date',
        de: 'Du bist auf dem neuesten Stand',
        pt: 'Você está atualizado',
        sv: 'Du är på den senaste versionen'
    },
    update_available_to_install: {
        en: 'Update available to install',
        de: 'Ein Update ist bereit zur Installation',
        pt: 'Atualização disponível para instalar',
        sv: 'Ny uppdatering finns tillgänglig'
    },
    install_now: {
        en: 'Install now',
        de: 'Jetzt installieren',
        pt: 'Instale agora',
        sv: 'Installera nu'
    },
    check_for_updates: {
        en: 'Check for updates',
        de: 'Nach Updates suchen',
        pt: 'Verificar atualizações',
        sv: 'Checka efter nya uppdateringar'
    },
    check: {
        en: 'Check',
        de: 'Prüfen',
        pt: 'Verificar',
        sv: 'Checka'
    },
    last_checked_date: {
        en: 'Last checked {d}',
        de: 'Zuletzt geprüft {d}',
        pt: 'Última verificação {d}',
        sv: 'Sist kollat {d}'
    },
    never_checked: {
        en: 'Never checked',
        de: 'Noch nicht geprüft',
        pt: 'Nunca verificado',
        sv: 'Aldrig checkat'
    },
    get_updates_fast: {
        name: {
            en: 'Get the latest updates as soon as they’re available',
            de: 'Erhalte die neuesten Updates, sobald sie verfügbar sind',
            pt: 'Receba as últimas atualizações assim que estiverem disponíveis',
            sv: 'Skaffa senaste uppdateringarna direkt när det finns tillgängligt'
        },
        body: {
            en: 'Be among the first to get the latest fixes and improvements as they roll out',
            de: 'Sei unter den Ersten, die die neuesten Fehlerbehebungen und Verbesserungen erhalten, sobald sie verfügbar sind',
            pt: 'Seja um dos primeiros a receber as últimas correções e melhorias assim que forem lançadas',
            sv: 'Bli bland dem första som får de senaste fixarna och optimeringarna så snart som dom kommit'
        }
    },
    pause_updates: {
        en: 'Pause updates',
        de: 'Updates pausieren',
        pt: 'Pausar atualizações',
        sv: 'Pausa uppdateringar'
    },
    pause_updates_for: {
        en: 'Pause for 1 day',
        de: 'Für einen Tag pausieren',
        pt: 'Pausar por 1 dia',
        sv: 'Pausa i 1 dag'
    },
    resume_updates: {
        en: 'Resume updates',
        de: 'Updates fortsetzen',
        pt: 'Resumir atualizações',
        sv: 'Återuppta uppdateringar'
    },
    updates_paused: {
        en: 'Updates paused',
        de: 'Updates pausiert',
        pt: 'Atualizações pausadas',
        sv: 'Uppdateringar har pausats'
    },
    paused_until_date: {
        en: 'Updates continue {d}',
        de: 'Updates werden {d} fortgesetzt',
        pt: 'Atualizações continuam {d}',
        sv: 'Uppdateringar fortsätter {d}'
    },
    missing_updates: {
        en: 'Missing updates',
        de: 'Fehlende Updates',
        pt: 'Atualizações em falta',
        sv: 'Saknar uppdateringar'
    },
    you_are_running_version: {
        en: 'You are running version {v}',
        de: 'Du verwendest Version {v}',
        pt: 'Você está usando a versão {v}',
        sv: 'Du är på version {v}'
    },
    you_are_installing_version: {
        en: 'You are installing version {v}',
        de: 'Du installierst Version {v}',
        pt: 'Você está instalando a versão {v}',
        sv: 'Du har installerat version {v}'
    },
    checked_for_updates: {
        en: 'Checked for updates',
        de: 'Updates wurden gesucht',
        pt: 'Verificou por atualizações',
        sv: 'Kolla efter uppdateringar'
    },
    select_all: {
        en: 'Select all',
        de: 'Alle auswählen',
        sv: 'Markera alla'
    },
    deselect_all: {
        en: 'De-select all',
        de: 'Alle abwählen',
        sv: 'Avmarkera alla'
    },
    use_current_time: {
        en: 'Use current time',
        de: 'Aktuelle Zeit verwenden',
        sv: 'Använd nuvarande tid'
    },
    time: {
        en: 'Time',
        de: 'Zeit',
        sv: 'Tid'
    },
    missing_fields: {
        en: 'Missing required fields',
        de: 'Fehlende erforderliche Felder',
        sv: 'Saknar nödvändiga fält'
    },
    requires_api_in_settings: {
        en: 'Requires API access in Settings',
        de: 'Erfordert API-Zugang in den Einstellungen',
        sv: 'Behöver API-åtkomst i inställningar'
    },
    no_token_provided: {
        en: 'No token provided',
        de: 'Kein Token angegeben',
        sv: 'Ingen token har angivits'
    },
    example: {
        en: 'e.g. {v}',
        de: 'z.B. {v}',
        pt: 'ex.: {v}',
        sv: 't.ex. {v}'
    },
    item_is_unavailable_on_platform: {
        en: '{i} is unavailable on {p}',
        de: '{i} ist auf {p} nicht verfügbar',
        pt: '{i} está indísponivel no {p}',
        sv: '{i} är inte tillgänglig på {p}'
    },
    platforms: {
        win32: {
            en: 'Windows'
        },
        darwin: {
            en: 'macOS'
        },
        ios: {
            en: 'iOS'
        },
        android: {
            en: 'Android'
        },
        linux: {
            en: 'Linux'
        },
        other: {
            en: 'Unknown',
            de: 'Unbekannt',
            pt: 'Desconhecido',
            sv: 'Okänd'
        }
    },
    reduced_motion: {
        name: {
            en: 'Reduce motion in animations',
            de: 'Bewegung von Animationen reduzieren',
            sv: 'Minska animationrörelse'
        },
        body: {
            en: 'Decreases the intensity of animations, hover effects, and other moving parts',
            de: 'Verringert die Intensität von Animationen, Hover-Effekten und anderen beweglichen Komponenten',
            sv: 'Minskar intensiteten av animationer, effekter vid hovring, och andra rörande delar'
        }
    },
    banners: {
        en: 'Banners',
        de: 'Banner'
    },
    view_backgrounds_on: {
        en: 'View banners on',
        de: 'Banner anzeigen auf',
        sv: 'Visa banners på'
    },
    own_profile: {
        en: 'Own profile',
        de: 'Meinem Profil',
        sv: 'Din egen profil'
    },
    other_profiles: {
        en: 'Other profiles',
        de: 'Anderen Profilen',
        sv: 'Andra profiler'
    },
    profile_avi_background: {
        name: {
            en: 'Prefer avatar image for profiles without a banner',
            de: 'Bevorzuge Profilbild für Profile ohne Banner',
            sv: 'Föredra profilbild för profiler utan en banner'
        },
        body: {
            en: 'All artist-based banner images will be replaced by the user’s avatar',
            de: 'Alle künstlerbasierten Bannerbilder werden durch das Profilbild des Benutzers ersetzt',
            sv: 'Alla artistbaserade bannerbilder blir ersätt av användarens profilbild'
        }
    },
    profile_banner: {
        name: {
            en: 'Profile banner',
            de: 'Profilbanner',
            sv: 'Profilbanner'
        },
        body: {
            en: 'Add your own custom banner image to your profile with [banner=url] in your bio',
            de: 'Füge deinem Profil ein eigenes Bannerbild hinzu, indem du deiner Biografie [banner=url] hinzufügst',
            sv: 'Läg till en egen banner till din profil genom att sätta [banner=url] i din biografi'
        }
    },
    profile_accent: {
        name: {
            en: 'Profile accent',
            de: 'Profilakzent',
            sv: 'Profilaccent'
        },
        body: {
            en: 'Add flair to your profile visible to all users regardless of personal accent',
            de: 'Füge deinem Profil einen Akzent hinzu, der für alle Benutzer sichtbar ist, unabhängig von deren persönlichem Akzent',
            sv: 'Lägg till flair på din profil som syns för alla användare oberoende på egen accentfärg'
        },
        reminder: {
            en: 'Changed your accent, don’t forget to save!',
            de: 'Du hast deinen Akzent geändert, vergiss’ nicht zu speichern!',
            sv: 'Ändrade din accentfärg, glöm inte att spara!'
        }
    },
    none: {
        // used for no profile banner or no starred friends
        // DE these need to be split for accurate translation. Banner -> "Keins", Starred friend -> "Kein:e"
        en: 'None',
        de: 'Keins',
        sv: 'Ingen'
    },
    current_banner_value: {
        en: 'Current banner: {v}',
        de: 'Aktuelles Banner: {v}',
        sv: 'Nuvarande banner: {v}'
    },
    show_your_progress: {
        name: {
            en: 'Show your plays compared to last week',
            de: 'Zeige deine Plays im Vergleich zur letzten Woche',
            sv: 'Visa dina spelningar jämfört med förra veckan'
        },
        body: {
            en: 'Compares your current progress to last week’s average, requires Last.fm Pro',
            de: 'Vergleicht deinen aktuellen Fortschritt mit dem Durchschnitt der letzten Woche, erfordert Last.fm Pro',
            sv: 'Jämför denna veckans spelningar med förra veckan, kräver Last.fm Pro'
        }
    },
    manual: {
        en: 'Manual',
        de: 'Manuell',
        sv: 'Manuellt'
    },
    enter_a_manual_date: {
        en: 'Enter a date in the format YYYY-MM-DD',
        de: 'Gebe ein Datum im Format JJJJ-MM-TT ein',
        sv: 'Skriv in ett datum med formatet YYYY-MM-DD'
    },
    minimum_value: {
        en: 'Minimum: {v}',
        de: 'Minimum: {v}',
        sv: 'Minst: {v}'
    },
    maximum_value: {
        en: 'Maximum: {v}',
        de: 'Maximum: {v}',
        sv: 'Max: {v}'
    },
    manual_date: {
        en: 'Type a date manually',
        de: 'Datum manuell eingeben',
        sv: 'Skriv in ett datum manuellt'
    },
    red: {
        en: 'Red',
        de: 'Rot',
        pt: 'Vermelho',
        sv: 'Röd'
    },
    orange: {
        en: 'Orange',
        de: 'Orange',
        pt: 'Laranja'
    },
    yellow: {
        en: 'Yellow',
        de: 'Gelb',
        pt: 'Amarelo',
        sv: 'Gul'
    },
    lime: {
        en: 'Lime',
        de: 'Limette',
        pt: 'Lima'
    },
    green: {
        en: 'Green',
        de: 'Grün',
        pt: 'Verde',
        sv: 'Grön'
    },
    aqua: {
        en: 'Aqua',
        de: 'Türkis',
        pt: 'Água',
        sv: 'Turkos'
    },
    blue: {
        en: 'Blue',
        de: 'Blau',
        pt: 'Azul',
        sv: 'Blå'
    },
    purple: {
        en: 'Purple',
        de: 'Lila',
        pt: 'Roxo',
        sv: 'Lila'
    },
    pink: {
        en: 'Pink',
        de: 'Rosa',
        pt: 'Rosa',
        sv: 'Rosa'
    },
    grey: {
        en: 'Grey',
        de: 'Grau',
        pt: 'Cinza',
        sv: 'Grå'
    },
    minis: {
        en: 'Minis',
        de: 'Minis',
        sv: 'Mini'
    },
    minis_description: {
        en: 'Play mini-games, puzzles, and interact with tools all powered by your listening history',
        de: 'Spiele Minispiele, Rätsel und interagiere mit Tools, die auf deinem Hörverlauf basieren',
        sv: 'Spela minispel, pussel, och interagera med verktyg som är helt baserad på din lyssningshistorik'
    },
    no_mini_found: {
        en: 'No mini found for ‘{v}’',
        de: 'Kein Mini für „{v}“ gefunden',
        sv: 'Ingen mini hittad för ‘{v}’'
    },
    pixel: {
        name: {
            en: 'Pixel'
        },
        body: {
            en: 'Guess the album from it’s pixelated artwork and clues',
            de: 'Errate das Album anhand des verpixelten Albumcovers und Hinweisen',
            sv: 'Gissa albumet från sin pixellerad konst och ledtrådar'
        }
    },
    rainbow: {
        name: {
            en: 'Rainbow',
            de: 'Regenbogen',
        },
        body: {
            en: 'Arrange your listening history into a swirl of colours',
            de: 'Stelle deinen Hörverlauf als Farbwirbel dar',
            sv: 'Ordna ihop din lyssningshistorik till en virvel av färg'
        }
    },
    receipt: {
        name: {
            en: 'Receipt',
            de: 'Quittung',
        },
        body: {
            en: 'Print out your top tracks as a receipt',
            de: 'Drucke deine Top-Songs als Quittung aus',
            sv: 'Skriv ut dina topplåtar som ett kvitto'
        }
    },
    collage_description: {
        en: 'Generate a personalised image based on your listening history and options',
        de: 'Erstelle ein personalisiertes Bild basierend auf deinem Hörverlauf und deinen Einstellungen',
        sv: 'Skapa en personlig bild baserad på din lyssningshistoria och inställningar'
    },
    labs_cta: {
        en: 'If you’re looking for more, try out Last.fm’s own {a}Labs feature{/a}.',
        de: 'Wenn du nach mehr suchst, probiere die {a}Labs-Funktion{/a} von Last.fm aus.',
        sv: 'Om du letar efter lite mer, testa Last.fm’s {a}egna Labs{/a}.'
    },
    compare_description: {
        en: 'Find your shared artists, albums, and tracks with another',
        de: 'Finde heraus, welche gemeinsamen Künstler:innen, Alben und Tracks du mit jemand anderem teilst',
        sv: 'Hitta dina delade artister, album, och låtar med nån annan'
    },
    enter_a_profile: {
        en: 'Enter a profile',
        de: 'Profil eingeben',
        sv: 'Skriv in ett användarnamn'
    },
    compare_with: {
        en: 'Compare with',
        de: 'Vergleichen mit',
        sv: 'Jämför'
    },
    value_settings: {
        en: '{v} Settings',
        de: '{v}-Einstellungen',
        sv: '{v} Inställningar'
    },
    suggest_title: {
        name: {
            en: 'This page doesn’t seem official',
            de: 'Diese Seite scheint nicht offiziell zu sein',
            sv: 'Denna sida ser inte ut att vara officiell'
        },
        body: {
            en: 'Navigate to {v} instead',
            de: 'Stattdessen zu {v} wechseln',
            sv: 'Hoppa till {v} istället'
        }
    },
    lyrics: {
        // lyrics
        en: 'Lyrics',
        name: {
            // the game
            en: 'Lyrics'
        },
        body: {
            en: 'Guess the song from a random lyric',
            de: 'Errate den Song anhand eines zufälligen Songtextes',
            sv: 'Gissa låten från en slumpad låttext'
        }
    },
    jumbled_title: {
        en: 'Jumbled title',
        de: 'Song-Durcheinander',
        sv: 'Omrörd titel'
    },
    re_jumble: {
        en: 'Re-jumble',
        de: 'Neu mischen',
        sv: 'Rör om igen'
    },
    begin: {
        en: 'Begin',
        de: 'Start',
        sv: 'Börja'
    },
    jumbled_guess: {
        en: 'Guess the album name with the pixelated cover, jumbled title, and hints!',
        de: 'Errate den Albumtitel mit verpixeltem Cover, durcheinandergewürfeltem Titel und Hinweisen!',
        sv: 'Gissa albumtiteln med pixellerad konst, omrörd titel, och ledtrådar!'
    },
    add_hint: {
        en: 'Add hint',
        de: 'Gib’ mir einen Tipp!',
        sv: 'Lägg till ledtråd'
    },
    give_up: {
        en: 'Give up',
        de: 'Aufgeben',
        sv: 'Ge upp'
    },
    you_guessed_correctly: {
        en: 'You guessed correctly!',
        de: 'Du hast richtig geraten!',
        sv: 'Du gissade rätt!'
    },
    guess: {
        en: 'Guess',
        de: 'Raten',
        sv: 'Gissa'
    },
    enter_a_guess: {
        en: 'Enter a guess',
        de: 'Gebe eine Vermutung ein',
        sv: 'Skriv in en gissning'
    },
    hints: {
        en: 'Hints',
        de: 'Tipps',
        sv: 'Ledtrådar',
        plays: {
            en: 'You have {v} plays on this album',
            de: 'Du hast {v} mal einen Song von diesem Album gehört',
            sv: 'Du har {v} lyssningar på det här albumet'
        },
        release: {
            en: 'Album was released on {v}',
            de: 'Das Album wurde am {v} veröffentlicht',
            sv: 'Albumet släpptes {v}'
        },
        tag: {
            en: 'The artist is tagged with {v}',
            de: 'Der/die Künstler:in ist mit {v} getaggt',
            sv: 'Artisten har taggats som {v}'
        },
        born: {
            en: 'The artist was born {v}',
            de: 'Der/die Künstler:in wurde {v} geboren',
            sv: 'Artisten var född {v}'
        }
    },
    reveal: {
        en: 'The album was {name} by {artist}',
        de: 'Das Album war {name} von {artist}',
        sv: 'Albumet var {name} av {artist}'
    },
    time_up: {
        en: 'Time is up!',
        de: 'Die Zeit ist um!',
        sv: 'Slut på tid!'
    },
    global: {
        en: 'Global',
        de: 'Weltweit',
        sv: 'Globalt'
    },
    mutuals: {
        en: 'Mutuals',
        de: 'Mutuals',
        sv: 'Ömsesidiga följare'
    },
    missing_component: {
        // cases when last.fm simply doesn't provide a tasteometer or other things
        en: 'Last.fm failed to load this component',
        de: 'Last.fm konnte diese Komponente nicht laden',
        sv: 'Last.fm kunde inte ladda denna komponent'
    },
    last_scrobbled_replace: {
        en: '{u} last scrobbled…',
        de: '{u} scrobbelte zuletzt…',
        fr: '{u} a scrobblé pour la dernière fois...',
        ja: '{u} が Scrobble した最新アイテム…',
        es: 'Último scrobbling de {u}…',
        it: 'Gli ultimi scrobbling di {u}…',
        pl: '{u} ostatnio scrobblował…',
        pt: 'Última faixa de {u} incluída no scrobble…',
        ru: '{u} скробблил(а) в последний раз…',
        sv: '{u} skrobblade senast…',
        tr: '{u} adlı kullanıcının son skropladıkları …',
        zh: '{u} 上次记录了...'
    },
    notification_replied_ctx: {
        // notifications can include text with valuable info such as:
        // and 7 others replied to your shout on
        // this is searching for the word "replied"
        en: 'replied',
        de: 'hat geantwortet',
        fr: 'a répondu',
        ja: '返信しました',
        es: 'respondió',
        it: 'risposto',
        pl: 'odpowiedział',
        pt: 'respondeu',
        ru: 'ответил(а)',
        sv: 'svarade',
        tr: 'cevap verdi',
        zh: '回复了'
    },
    user_commented: {
        en: '{u} commented',
        de: '{u} hat kommentiert',
        sv: '{u} kommenterade'
    },
    users_commented: {
        en: '{u} and {c} others commented',
        de: '{u} und {c} andere haben kommentiert',
        sv: '{u} och {c} andra kommenterade'
    },
    user_replied: {
        en: '{u} replied',
        de: '{u} hat geantwortet',
        sv: '{u} svarade'
    },
    users_replied: {
        en: '{u} and {c} others replied',
        de: '{u} und {c} andere haben geantwortet',
        sv: '{u} och {c} andra svarade'
    },
    obsession_expired: {
        en: 'Your obsession has expired',
        de: 'Deine Obsession ist ausgelaufen',
        sv: 'Din besatthet har tagit slut'
    },
    listening_report_available: {
        en: 'View your {m} listening report',
        de: 'Schaue deinen Hörbericht an',
        sv: 'Visa din lyssningsrapport för {m}'
    },
    count_mutual_listeners: {
        en: 'You have {c} mutual listeners',
        de: 'Du hast {c} gemeinsame Hörer',
        sv: 'Du har {c} ömsesidiga lyssnare'
    },
    no_mutual_listeners: {
        en: 'You have no mutual listeners',
        de: 'Du hast keine gemeinsamen Hörer',
        sv: 'Du har inga ömsesidiga lyssnare'
    },
    no_mutual_listeners_explain: {
        en: 'This can be due to either simply lacking mutuals who listen or the page being subject to a broken redirect.',
        de: 'Dies kann entweder an fehlenden Mutuals oder einer fehlerhaften Seitenweiterleitung liegen.',
        sv: 'Det kan innebära att du antingen inte har ömsesidiga följare som lyssnar eller att sidan har en gammal omdirigering'
    },
    navigation_items: {
        name: {
            en: 'Quick access',
            de: 'Schnellzugriff',
            sv: 'Snabbåtkomst'
        },
        body: {
            en: 'Arrange your navigation menu to suit your usage best',
            de: 'Ordne dein Navigationsmenü so an, dass es am besten zu deiner Nutzung passt',
            sv: 'Ordna din navigationsmeny för att bäst passa dig'
        }
    },
    edit_quick_access: {
        en: 'Edit quick access',
        de: 'Schnellzugriff bearbeiten',
        sv: 'Redigera snabbåtkomst'
    },
    navigation_language: {
        en: 'Show option to change language',
        de: 'Option zum Ändern der Sprache anzeigen',
        sv: 'Visa alternativet att ändra språk'
    },
    branding: {
        en: 'Branding'
    },
    branding_type: {
        name: {
            en: 'Branding type',
            de: 'Branding-Art',
            sv: 'Brandingalternativ'
        },
        body: {
            en: 'Decide which branding source to use for the header',
            de: 'Wähle aus, welches Branding für die Kopfzeile verwendet werden soll',
            sv: 'Välj vilken sorts branding för att använda på sidhuvudet'
        }
    },
    expand_tracks: {
        name: {
            en: 'Extend track height to show album title',
            de: 'Titelhöhe erweitern, um den Albumtitel anzuzeigen',
            sv: 'Öka låtstorleken för att visa albumtiteln'
        },
        body: {
            en: 'Increases the size of the track’s cover art to make room for it’s accompanying album',
            de: 'Erhöht die Größe des Songcovers, um Platz für das zugehörige Album zu schaffen',
            sv: 'Ökar på storleken på låtens albumkonst för att få plats med albumtiteln'
        }
    },
    expand_tracks_when_active: {
        en: 'Only when actively scrobbling',
        de: 'Nur während des aktiven Scrobbelns',
        sv: 'Endast när du skrobblar'
    },
    expand_tracks_always: {
        en: 'Always when possible',
        de: 'Immer, wenn möglich',
        sv: 'Alltid, när det är möjligt'
    },
    rain: {
        name: {
            en: 'Enable rainfall',
            de: 'Regen aktivieren',
            sv: 'Aktivera regn'
        },
        body: {
            en: 'Immerse yourself in soothing visual rain',
            de: 'Tauche in den beruhigenden visuellen Regen ein',
            sv: 'Omsluta dig själv i en lugnande regneffekt'
        }
    },
    images: {
        en: 'Images',
        de: 'Bilder',
        sv: 'Bilder'
    },
    static_gifs: {
        en: 'Control animation of GIFs',
        de: 'Steuere die Animation von GIFs',
        sv: 'Kontrollera GIF-animation'
    },
    always_animate: {
        en: 'Always animate',
        de: 'Immer animieren',
        sv: 'Animera alltid'
    },
    only_on_hover: {
        en: 'Only on hover',
        de: 'Nur beim Hovern',
        sv: 'Endast under hovring'
    },
    static_banners: {
        en: 'Prevent animations in profile banners',
        de: 'Deaktiviere Animationen in Profilbannern',
        sv: 'Stäng av animationer i profilbanners'
    },
    change_zoom: {
        en: 'Change zoom level',
        de: 'Zoomlevel ändern',
        sv: 'Ändra zoomnivå'
    },
    static_avatars: {
        en: 'User avatars',
        de: 'Benutzer-Profilbilder',
        sv: 'Användarprofilbilder'
    },
    static_music: {
        en: 'Artists and albums',
        de: 'Künstler:innen und Alben',
        sv: 'Artister och album'
    },
    apply_to: {
        en: 'Apply to',
        de: 'Anwenden auf',
        sv: 'Tillämpa till'
    },
    change_images_for: {
        en: 'Change images for',
        de: 'Bilder ändern für',
        sv: 'Ändra bild för'
    },
    leaving_site: {
        name: {
            en: 'Don’t get lost',
            de: 'Verirre dich nicht',
            sv: 'Gå inte vilse'
        },
        body: {
            en: 'This link is taking you to the following location',
            de: 'Dieser Link führt dich zu folgendem Ort',
            sv: 'Länken tar dig till den här platsen'
        }
    },
    leaving_site_dangerous: {
        name: {
            en: 'Be careful',
            de: 'Vorsicht',
            sv: 'Var försiktig'
        },
        body: {
            en: 'This link can open an application on your device',
            de: 'Dieser Link kann eine Anwendung auf deinem Gerät öffnen',
            sv: 'Länken kan öppna en applikation på din enhet'
        }
    },
    leaving_site_checkbox: {
        en: 'Trust {v} links in the future',
        de: '{v}-Links zukünftig vertrauen',
        sv: 'Lita på länkar från {v} i framtiden'
    },
    visit: {
        en: 'Visit',
        de: 'Besuchen',
        sv: 'Besök'
    },
    auto_correct_scrobbles: {
        name: {
            en: 'Auto correct and redirect scrobbles',
            de: 'Automatisches Korrigieren und Umleiten von Scrobbles',
            sv: 'Autokorrigering och omdirigering av skrobblingar'
        },
        body: {
            en: 'Changes artist names based on the legacy Last.fm redirect system pre-2015, causes many issues',
            de: 'Ändert Künstlernamen basierend auf dem Legacy-Last.fm-Umleitungssystem vor 2015, verursacht viele Probleme',
            sv: 'Ändrar artistnamn baserad på Last.fms omdirigeringssystem från innan 2015, skapar många problem'
        },
        warning: {
            en: 'This setting should be turned off to ensure scrobbles are correctly stored for each artist.',
            de: 'Diese Einstellung sollte deaktiviert werden, um sicherzustellen, dass Scrobbles für jeden Künstler korrekt gespeichert werden.',
            sv: 'Denna inställning ska stängas av för att vara säker på att dina skrobblingar är rätt för alla artister.'
        }
    },
    timezone: {
        en: 'Timezone',
        de: 'Zeitzone',
        sv: 'Tidszon'
    },
    location: {
        name: {
            en: 'Location',
            de: 'Standort',
            sv: 'Plats'
        },
        body: {
            en: 'Last.fm uses your location for event recommendations and local music data',
            de: 'Last.fm verwendet deinen Standort für Veranstaltungsempfehlungen und lokale Musikdaten',
            sv: 'Last.fm använder din plats för evenemangrekommendationer och lokal musikdata'
        }
    },
    event_radius: {
        en: 'Event search radius',
        de: 'Suchradius für Veranstaltungen',
        sv: 'Sökradie för evenemang'
    },
    you_need_to_be_logged_in: {
        en: 'You need to be logged in',
        de: 'Du musst eingeloggt sein',
        sv: 'Du lär vara inloggad'
    },
    oracle_notice: {
        en: 'You are currently testing ‘oracle’, a redesigned album and track view',
        de: 'Du testest gerade „oracle“, eine neu gestaltete Album- und Titelseite'
    },
    debug: {
        en: 'Debug'
    },
    send_feedback: {
        en: 'Send feedback',
        de: 'Feedback senden'
    },
    oracle_heading: {
        en: 'Experimental',
        de: 'Experimentell'
    },
    oracle_beta: {
        name: {
            en: 'Enable the experimental ‘oracle’ system',
            de: 'Experimentelles „oracle“-System aktivieren'
        },
        body: {
            en: 'A redesigned album and track view sourcing data from MusicBrainz. May be released in the future or scrapped. Please send feedback from usage.',
            de: 'Eine neu gestaltete Album- und Titelseite, die Daten von MusicBrainz bezieht. Kann in Zukunft veröffentlicht oder verworfen werden. Bitte sende Feedback basierend auf deiner Nutzung.'
        }
    },
    label: {
        en: 'Label',
        de: 'Label',
        sv: 'Skivbolag'
    },
    explicit: {
        en: 'Explicit',
        de: 'Anstößig'
    },
    control_center: {
        en: 'Control center',
        de: 'Kontrollzentrum',
        sv: 'Kontrollcenter'
    },
    romanise_titles: {
        en: 'Romanise music titles and artist names for',
        de: 'Musiktitel und Künstlernamen romanisieren für',
        sv: 'Romanisera låttitlar och artistnamn för'
    },
    romanise_jp: {
        en: '日本語 (Japanese)',
        de: '日本語 (Japanisch)',
        sv: '日本語 (Japanska)'
    },
    romanise_ko: {
        en: '한국어 (Korean)',
        de: '한국어 (Koreanisch)',
        sv: '한국어 (Koreanska)'
    },
    disc_number: {
        en: 'Disc {n}',
        de: 'Disc {n}',
        sv: 'Skiva {n}'
    },
    create_playlist: {
        en: 'Create playlist',
        de: 'Playlist erstellen',
        sv: 'Skapa spellista'
    },
    music_links: {
        name: {
            en: 'Music linking',
            de: 'Musikverlinkung',
            sv: 'Musiklänkar'
        },
        body: {
            en: 'Choose which services to display for artists, albums, and tracks',
            de: 'Wähle aus, welche Dienste für Künstler:innen, Alben und Songs angezeigt werden sollen',
            sv: 'Välj vilka tjänster att visa för artister, album, och låtar'
        }
    }
};

export const trans_legacy = {
    en: {
        pages: {
            bleh_settings: {
                '': 'bleh settings'
            },
            bleh_setup: {
                '': 'bleh setup'
            },
            bleh_sponsor: {
                '': 'sponsor'
            },
            home: {
                overview: 'home',
                artists: 'artists',
                albums: 'albums',
                tracks: 'tracks',
                events: 'events'
            },
            overview: {
                music: 'home'
            },
            recommended: {
                artists: 'recommended artists',
                albums: 'recommended albums',
                tracks: 'recommended tracks',
                rediscover: 'blasts from the past',
                tags: 'recommended tags'
            },
            bookmarks: {
                overview: 'bookmarks',
                artists: 'bookmarks',
                albums: 'bookmarks',
                tracks: 'bookmarks',
                tags: 'bookmarks'
            },
            search: {
                overview: '{name} · search',
                artists: '{name} · artist search',
                albums: '{name} · album search',
                tracks: '{name} · track search'
            },
            labs: {
                overview: 'labs'
            },
            settings: {
                overview: 'settings',
                privacy: 'privacy · settings',
                account_overview: 'account · settings',
                website: 'website · settings',
                subscription_overview: 'last.fm pro · settings',
                'subscription_automatic-edits_albums':
                    'album auto edits · settings',
                'subscription_automatic-edits_tracks':
                    'track auto edits · settings',
                applications_overview: 'applications · settings'
            },
            inbox: {
                overview: 'incoming inbox',
                sent_overview: 'outgoing inbox',
                compose: 'compose message',
                message_overview: 'message',
                sent_message: 'message',
                notifications: 'notifications'
            },
            releases: {
                'out-now_recommended': 'out now',
                'out-now_popular': 'out now',
                'coming-soon_recommended': 'coming soon',
                'coming-soon_popular': 'coming soon'
            },
            charts: {
                overview: 'live charts',
                weekly: 'weekly charts'
            },
            user: {
                overview: '{name} · profile',
                'listening-report_week': '{name} · profile reports',
                'listening-report_month': '{name} · profile reports',
                'listening-report_year': '{name} · profile reports',
                library_overview: '{name} · profile library',
                library_artists: '{name} · profile library',
                library_albums: '{name} · profile library',
                library_tracks: '{name} · profile library',
                library_artist_overview: '{name} · profile library',
                library_album_overview: '{name} · profile library',
                library_track_overview: '{name} · profile library',
                library_artist_albums: '{name} · profile library',
                library_artist_tracks: '{name} · profile library',
                following: '{name} · profile following',
                followers: '{name} · profile followers',
                neighbours: '{name} · profile neighbours',
                shoutbox_overview: '{name} · profile shouts',
                loved: '{name} · profile loved',
                obsessions: '{name} · profile obsessions',
                events: '{name} · profile events',
                playlists_playlists: '{name} · profile playlists',
                tags_overview: '{name} · profile tags'
            },
            artist: {
                overview: '{name} · artist',
                tracks: '{name} · artist tracks',
                albums: '{name} · artist albums',
                images_overview: '{name} · artist photos',
                'images_image-upload': '{name} · artist photos',
                image: '{name} · artist photo',
                similar: '{name} · artist similar',
                wiki_overview: '{name} · artist wiki',
                wiki_edit: '{name} · artist wiki',
                wiki_history: '{name} · artist wiki',
                listeners_overview: '{name} · artist top listeners',
                'listeners_you-know': '{name} · artist listeners you know',
                shoutbox_overview: '{name} · artist shouts',
                events: '{name} · artist events',
                tags_overview: '{name} · artist tags'
            },
            album: {
                overview: '{name} - {sister} · album',
                wiki_overview: '{name} - {sister} · album wiki',
                wiki_edit: '{name} - {sister} · album wiki',
                wiki_history: '{name} - {sister} · album wiki',
                images_overview: '{name} - {sister} · album photos',
                'images_image-upload': '{name} - {sister} · album photos',
                image: '{name} - {sister} · album photo',
                shoutbox_overview: '{name} - {sister} · album shouts',
                tags_overview: '{name} - {sister} · album tags'
            },
            track: {
                overview: '{name} - {sister} · track',
                albums: '{name} - {sister} · track albums',
                wiki_overview: '{name} - {sister} · track wiki',
                wiki_edit: '{name} - {sister} · track wiki',
                wiki_history: '{name} - {sister} · track wiki',
                shoutbox_overview: '{name} - {sister} · track shouts',
                tags_overview: '{name} - {sister} · track tags'
            }
        },
        badges: {
            missing: {
                name: 'No badges'
            },
            'user-status-subscriber': {
                name: 'Last.fm Pro',
                reason: 'Active Pro subscription'
            },
            'user-status-staff': {
                name: 'Staff',
                reason: 'Staff member of Last.fm'
            },
            'label--fade': {
                reason: 'They follow you'
            },
            contributor: {
                name: 'bleh contributor',
                reason: 'Contributed to bleh via code or translations'
            },
            translation: {
                reason: 'Translated for a supported language'
            },
            cat: {
                name: 'it’s a kitty!!'
            },
            sponsor: {
                name: 'Sponsoring',
                reason: 'Sponsored bleh and bwaa :3'
            },
            cute: {
                reason: 'Reserved for special users'
            },
            reserved: {
                reason: 'Reserved for certain users'
            }
        },
        avatar_for_me: 'Your avatar',
        avatar_for_user: 'Avatar for ',
        actions: {
            view_profile: 'View profile',
            view_library: 'Library',
            leave_a_shout: 'Shouts'
        },
        lotus: {
            artist: 'Artist corrections have been downloaded!',
            album_track: 'Album and track corrections have been downloaded!',
            version: 'You are running lotus version {v}.',
            tooltip:
                'lotus is the community correction system used in bleh and bwaa',
            check: 'Check for updates',
            correct: {
                name: 'Correct capitalisation',
                tooltip: 'Submit name correction',
                tooltip_active: 'Active name correction'
            }
        },
        glacier: {
            name: 'Library refresh',
            by_artist: ' by {a}',
            meta: {
                artists: 'Artists',
                albums: 'Albums',
                tracks: 'Tracks',
                average: 'Average'
            },
            view: {
                grid: 'Grid',
                list: 'List',
                line: 'Line',
                pie: 'Pie',
                bar: 'Bar'
            },
            axis: {
                horizontal: 'Horizontal',
                vertical: 'Vertical'
            },
            dates: {
                last_year: 'Last year',
                this_year: 'This year'
            },
            edit: 'Edit',
            delete: 'Delete',
            love: 'Love',
            bulk_edit: 'Bulk edit',
            option: {
                name: 'Use new graphs in library',
                bio: 'This can add a little amount of slow-down in some cases but with the benefit of awesome graphs.'
            }
        },
        changelog: {
            name: 'What’s New?',
            subtitle: 'from {u}',
            type: {
                major: 'Major release',
                minor: 'Minor release',
                general: 'General improvements',
                fix: 'Bug fix'
            },
            latest: 'Latest',
            view_major: 'View latest major release'
        },
        auth_menu: {
            dev: 'Toggle dev mode',
            configure_bleh: 'Configure bleh',
            library: 'Library',
            shouts: 'Shouts',
            obsessions: 'Obsessions',
            labs: 'Labs',
            bookmarks: 'Bookmarks',
            settings: 'Settings',
            logout: 'Logout',
            seasonal_notice:
                'To watch the counter update live, click and stay on the tab that opens.',
            seasonal_live: 'Counter is updating live!'
        },
        music: {
            submit_lastfm_correction: 'Submit correction to Last.fm',
            search_variations: {
                name: 'Search',
                tooltip: 'Search for variations of this title'
            },
            search_genius: 'Search lyrics',
            fetch_plays: {
                name: 'Tracklist',
                info: 'Sourced from your own plays as an official tracklist is unavailable',
                loading: 'Fetching your plays on this album',
                fail: 'You do not have any plays on this album',
                open_as_track: 'Open album title as a track'
            },
            from_the_album: 'From the album: {album}',
            listens: {
                count_listens: '{c} listens',
                loading_listens: 'listens',
                other_listeners: '{c} others',
                custom: {
                    tooltip: 'Pick a user',
                    name: 'View listens from another user'
                }
            },
            wiki: 'About',
            wiki_edit: 'edit wiki',
            wiki_read: 'read more',
            refresh: 'Refresh',
            refresh_tracks: 'Refresh tracks',
            menu: 'Extra options',
            obsession: 'Obsess',
            obsession_first: 'First to claim this obsession!',
            compare: {
                name: 'Compare',
                header: 'Compare plays'
            },
            about: 'About',
            about_guests: 'Others featured',
            view_profile: 'View profile'
        },
        error: {
            name: 'This page is missing...',
            go_back: 'Go back',
            visit_profile: 'Visit profile',
            try_again: 'Try again'
        },
        statistics: {
            scrobbles: {
                name: 'Your scrobbles'
            },
            plays: {
                name: 'plays'
            }
        },
        profile: {
            name: 'Profile',
            on_ignore_list: 'Ignored',
            friends: {
                name: 'Friends'
            },
            display_name: {
                aka: 'aka.',
                pronouns: 'pronouns'
            },
            created: {
                name: 'created',

                replace: '• scrobbling since '
            },
            edit: 'Edit profile',
            obsess: 'Obsess',
            message: 'Message',
            sponsor: 'Sponsor',
            message_sponsor: 'Receive sponsor rewards',
            shortcut: {
                add: 'Shortcut',
                remove: 'Shortcut'
            },
            scrobbles: 'Scrobbles',
            artists: 'Artists',
            loved: 'Loved',
            taste: 'Taste similarity',
            taste_meter: {
                level: {
                    super: 'Super',
                    very_high: 'Very High',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                    very_low: 'Very Low',
                    unknown: 'Unknown'
                },
                you_share_1: '{artist}',
                you_share_2: '{artist1}, {artist2}',
                you_share_3: '{artist1}, {artist2}, {artist3}'
            },
            open_avatar: 'Open in a new tab',
            settings: 'Configure',
            events: 'Events',
            top_badge: 'Top Badge',
            progress: {
                to_go: '{s} scrobbles to go',
                tier: 'Tier {t}',
                explain: 'For each tier, you unlock a new badge'
            }
        },
        event: {
            name: 'Event',
            going: '{c} going',
            maybe: '{c} interested',
            you_know: 'Who you know',
            all_time: 'All time',
            total: '{c} total'
        },
        messaging: {
            update: 'bleh has updated to version {v}!'
        },
        wiki: {
            latest: 'View latest version',
            syntax: {
                name: 'Use fancy syntax when editing',
                links_to: 'Links to {link}'
            },
            presets: {
                name: 'Symbol presets'
            }
        },
        settings: {
            name: 'Settings',
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            clear: 'Clear',
            create: 'Create',
            add: 'Add',
            remove: 'Remove',
            done: 'Done',
            finish: 'Finish',
            continue: 'Continue',
            reset: 'Reset to default',
            go: 'Go',
            skip: 'Skip',
            back: 'Back',
            send: 'Send',
            send_quickly: 'Send quickly with {kbd}',
            right_click: 'Right-click for more options',
            reload: {
                name: 'Refresh pending',
                body: 'A setting you changed requires a page refresh to take effect.'
            },
            new: 'New',
            beta: 'Beta',
            configure: 'Configure',
            pages: {
                overview: 'Profile',
                privacy: 'Privacy',
                account_overview: 'Account',
                website: 'Website',
                subscription_overview: 'Pro',
                applications_overview: 'Applications'
            },
            examples: {
                button: 'Example button'
            },
            skip_to: {
                name: 'Skip to'
            },
            home: {
                name: 'Home',
                brand: 'bleh',
                version: 'Version {v}',
                recommended: 'Recommended settings',
                issues: {
                    name: 'Issues',
                    bio: 'Report bugs'
                },
                update: {
                    name: 'Updates',
                    css: 'Update style',
                    bio: 'Check now',
                    notice: 'There are updates available!',
                    ignore: 'Ignore temporarily',

                    update_now: 'Update now',
                    update_to_v: 'Update to {v}'
                },
                setup: {
                    name: 'Setup',
                    bio: 'Re-enter setup'
                },
                colours: {
                    name: 'Colours',
                    bio: 'Pick your favourite!'
                },
                thanks: 'Welcome {m}, you are running bleh version {v}.',
                sponsor: {
                    name: 'Sponsor',
                    header: 'Sponsor the development of bleh and bwaa',
                    bio: 'If you feel my work on these projects is worthy of donations you are welcome to sponsor me on GitHub. This is of course optional and bleh will forever be open-source and free.',
                    thanks: 'Thank you for sponsoring {m}, you are running bleh version {v}.',
                    status: {
                        yes: 'You are a sponsor, thank you!',
                        no: 'Become a sponsor to get a custom badge',
                        badge: 'To configure your custom badge, get in touch with me.',
                        one_time:
                            'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version:
                        'You have version {v} of the sponsorship/badge data downloaded.'
                }
            },
            appearance: {
                name: 'Appearance'
            },
            themes: {
                name: 'Themes',
                bio: 'Choose from light to midnight.',
                dark: {
                    name: 'Dark',
                    bio: 'The default flavour of bleh'
                },
                darker: {
                    name: 'Darker',
                    bio: 'The in-between'
                },
                oled: {
                    name: 'Midnight',
                    bio: 'Ultra blackout'
                },
                light: {
                    name: 'Light',
                    bio: 'Low saturation and bright'
                },
                classic: {
                    name: 'Classic',
                    bio: 'Re-live early computing'
                }
            },
            music: {
                name: 'Music',
                header: 'Music configuration',
                bio: 'Configure your music-related settings for profiles, artists, albums, and tracks.',
                profile_shortcut: {
                    name: 'Profile shortcut',
                    bio: "Quickly access a user's plays on an artist, album, or track page.",
                    placeholder: 'Profile',
                    header: 'Enter username',
                    saved: 'Profile shortcut is valid',
                    failed: 'Profile does not exist or failed to load'
                },
                show_bulk_edit_album: {
                    name: 'Show album in chartlists',
                    bio: 'This is disabled by default as hovering over tracks reveals the album title in all areas',
                    require:
                        'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Accessibility',
                shout_preview:
                    'some completely random text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                accessible_name_colours: {
                    name: 'Prefer accessible name colours',
                    bio: 'Use the default header text colour over a accented text colour.'
                },
                underline_links: {
                    name: 'Always underline links',
                    bio: 'Make links to interactables stand out.'
                },
                reduced_motion: {
                    name: 'Reduce animations around interfaces',
                    bio: 'Will in most cases either slowly fade or hard-cut, no scaling.'
                },
                toggle_icon: {
                    name: 'Add indicator icon to toggles',
                    bio: 'Display a checkmark or a cross depending on toggle state.'
                }
            },
            layout: {
                name: 'Layout',
                header: 'Manage header layout',
                avatar_action: {
                    name: 'Default avatar action',
                    bio: 'What do you want to happen when you click avatars?',
                    gallery: 'View photos (or featured album for tracks)',
                    album: 'View featured album'
                }
            },
            customise: {
                name: 'Customise',
                colours: {
                    name: 'Colours',
                    modals: {
                        custom_colour: {
                            hue: 'Accent colour',
                            sat: 'Saturation',
                            lit: 'Lightness',
                            seasonal_alert:
                                'The current season is overriding your accent colour, adjust sliders to disable.'
                        }
                    },
                    swatches: {
                        default: 'Default',
                        avatar: 'Avatar',
                        seasonal: 'Seasonal',
                        custom: 'Customise'
                    }
                },
                high_contrast: {
                    name: 'Enable high contrast mode'
                },
                seasonal: {
                    name: 'Seasonal',
                    timeline: 'Seasonal timeline',
                    bio: 'During seasonal events, bleh can automatically change the default accent colour, add particles, and add overlays to various interface elements.',
                    info: 'Seasonal events try to match your timezone, for reference we calculated {offset}',
                    started: 'Started',
                    ends_in: 'Ends in',
                    listing: {
                        none: 'No active season',
                        easter: 'Easter',
                        pride: 'Pride',
                        halloween: 'Halloween',
                        pre_fall: 'Pre-Fall',
                        fall: 'Fall',
                        christmas: 'Christmas',
                        new_years: 'New Years'
                    },
                    option: {
                        name: 'Enable seasonal event system'
                    },
                    marker: {
                        current: 'The current season is {season} for {time}.',
                        started: 'started {time}',
                        none: 'There is no active season currently.',
                        disabled:
                            'You have seasons disabled, enable to view current event.'
                    },
                    particles: {
                        name: 'Display particles during select seasons',
                        bio: 'During winter seasons you get snowflakes!'
                    },
                    show_less_particles: {
                        name: 'Display a reduced number of particles'
                    },
                    fps_particles: {
                        name: 'Display particles without fancy effects',
                        bio: 'This might be more demanding on some systems'
                    },
                    overlays: {
                        name: 'Display additional seasonal effects',
                        bio: 'During winter seasons this is used for ice effects, otherwise mainly just gradients.'
                    },
                    announce: 'It is now {s}!',
                    nonsense: 'A Nonsense Christmas',
                    fruitcake: 'fruitcake',
                    mistletoe: 'Mistletoe',
                    festival: 'Christmas Eve',
                    view: 'Open seasonal tab',
                    none: 'No colours available'
                },
                artwork: {
                    name: 'Artwork'
                },
                hue_from_album: {
                    name: 'Colour album pages based on album art',
                    bio: 'Picks the primary colour from an album cover to paint the page.'
                },
                gloss: {
                    name: 'Gloss overlay',
                    bio: 'Apply flair to all cover arts.'
                },
                display: {
                    name: 'Display'
                },
                colourful_counts: {
                    name: 'Use a colour gradient for all-time charts',
                    bio: 'Assigns a colour from a gradient based on your position in all-time artist scrobbles.'
                },
                colourful_tracks: {
                    name: 'Colour actively scrobbling tracks based on album art',
                    bio: 'Picks the primary colour from the associated cover to paint the track.'
                },
                gendered_tags: {
                    name: 'Hide gendered tags',
                    bio: 'Gender-specific tags are deemed redundant by default.'
                },
                rain: {
                    name: 'Let it rain!',
                    bio: 'rain :3c (may have performance impacts !! also may look bad !!)'
                },
                show_your_progress: {
                    name: 'Show your weekly progress',
                    bio: 'too many numbers ~w~'
                },
                profile_header: {
                    name: 'Display profile backgrounds',
                    see_type: 'Source from avatar instead of top artist',
                    view_on: 'View backgrounds on',
                    for_own: 'My own profile',
                    for_others: 'Other profiles'
                },
                sat_bg: {
                    name: 'Card background saturation',
                    bio: 'Control the colour of backgrounds in addition to main accent'
                }
            },
            activities: {
                name: 'Activities',
                bio: 'Display your most recent activities locally on your profile, only for you to see.',
                toggle: {
                    name: 'Enable activity tracking',
                    bio: 'Events will only be registered and displayed while enabled.'
                },
                types: {
                    shout: 'Shouts',
                    image: 'Image uploads and interactions',
                    obsess: 'Track obsessions',
                    love: 'Track love',
                    install: 'Installing and updating',
                    wiki: 'Wiki editing'
                }
            },
            performance: {
                name: 'Troubleshooting',
                bio: 'Running into noticeable issues in theme loading? Try out these settings.',
                dev: {
                    name: 'Disable in-built theme loading',
                    bio: 'This allows you to load the in-built theme via Stylus instead, which may be more performant.',
                    modals: {
                        prompt: {
                            alert: 'Once you refresh the page, the in-built bleh theme will be disabled (unless you disable this option again).',
                            stylus: 'If you do not already have the <strong>Stylus</strong> extension, choose your browser below:',
                            browsers: {
                                chrome: {
                                    name: 'Chrome',
                                    bio: 'for Chrome, Edge, Brave, Opera'
                                },
                                firefox: {
                                    name: 'Firefox',
                                    bio: 'for Firefox only'
                                }
                            }
                        },
                        continue: {
                            next_step:
                                'Once you have the extension installed, hit "Install style" on the new tab that will open.'
                        },
                        finish: {
                            alert: 'All done! From now on, styling will be handled via Stylus.'
                        }
                    }
                },
                bug: {
                    name: 'Something wrong?',
                    bio: 'Report a bug in the bleh repo to get it fixed.'
                }
            },
            profiles: {
                name: 'Profile',
                bio: 'Manage your personal data and data stored on other profiles.',
                notes: {
                    name: 'Notes',
                    header: 'Note',
                    placeholder: 'Enter a local note for this user',
                    edit: 'Edit note',
                    delete: 'Remove note',
                    edit_user: "Edit {u}'s note",
                    delete_user: "Remove {u}'s note",
                    view: 'View your profile notes'
                },
                you: 'You',
                avatar_radius: {
                    name: 'User avatar shape'
                },
                api: {
                    name: 'API access',
                    bio: 'Enter a Last.fm API key to use new features, such as:',
                    features: [{}],
                    placeholder: 'Enter API key',
                    saved: 'Saved your API key, testing..',
                    confirmed: 'Verified your API key, enjoy!',
                    inaccessible: 'Last.fm API is inaccessible',
                    invalid: 'That key seems invalid, are you sure?',
                    rate_limit: 'Your key is rate-limited for a short time'
                }
            },
            redirects: {
                name: 'Redirects',
                bio: "Manage last.fm's (not) handy redirection system as best as possible.",
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: "No, I didn't mean Travi$ Scott"
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: "By default, last.fm will 'auto-correct' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.",
                    action: 'Open Settings'
                }
            },
            corrections: {
                name: 'Corrections',
                bio: 'Manage capitalisation of artist, album, and track names with community contributions.',
                toggle: {
                    name: 'Enable the correction system'
                },
                view: {
                    name: 'View current corrections',
                    bio: 'Lists all active in your install'
                },
                formatting: 'Smart music titles',
                format_guest_features: {
                    name: 'Format guest features and song tags',
                    bio: 'Splits track and album titles into their individual tags such as guest features, versions, remixes.'
                },
                show_guest_features: {
                    name: 'Show featured artists in track title',
                    bio: 'Featured artists are always shown below the title regardless.'
                },
                stacked_chartlist_info: {
                    name: 'Stack track name and title',
                    bio: 'Both matches streaming services and increases max length of each.'
                },
                show_remaster_tags: {
                    name: 'Show remaster tags',
                    bio: "Nobody likes remasters (or the tags), if you'd prefer to still listen but remove the annoyance hide them!"
                },
                submit: {
                    name: 'Submit new correction',
                    bio: 'Have a name that you feel is capitalised wrong?',
                    action: 'Submit'
                },
                listing: {
                    artists: 'Artists',
                    albums_tracks: 'Albums and tracks'
                }
            },
            language: {
                name: 'Language',

                supported: 'Supported by bleh',
                by: 'by {users}',
                submit: {
                    name: 'Are you fluent in another language?',
                    bio: 'Translations are purely community-contributed.',
                    action: 'Submit translation'
                }
            },
            text: {
                name: 'Text',
                shout_preview_md:
                    'some <strong>completely</strong> random!<br>text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                shout_preview:
                    "some completely random! text that doesn't mean anything at all",
                markdown: {
                    name: 'Use markdown formatting',
                    bio: 'Enables line-breaks, bold, italics, and links.',
                    shouts: 'In shouts',
                    profile: 'In profile bios'
                },
                font: {
                    name: 'Font settings',
                    placeholder: 'Font name(s), separated by commas'
                },
                font_weight: {
                    name: 'Font weight',
                    bio: 'Used for most regular text'
                },
                font_weight_medium: {
                    name: 'Medium font weight',
                    bio: 'Used for bold text'
                },
                font_weight_bold: {
                    name: 'Bold font weight',
                    bio: 'Used for larger text such as headers'
                },
                font_emoji: {
                    name: 'Use compatibility emoji font',
                    bio: 'On Windows systems prior to 11, the emoji font is majorly outdated unless this option is used. (such as 🏳️‍⚧️)'
                }
            },
            inbuilt: {
                profile: {
                    name: 'Profile',
                    subtitle: {
                        name: 'Subtitle',
                        aka: 'aka.',
                        pronouns: 'pronouns'
                    },
                    pronoun_tip:
                        'When pronouns are placed first, "aka." will change to "pronouns".',
                    country: 'Country',
                    website: 'Website',
                    about: 'About',
                    toggle_preview: {
                        name: 'Toggle preview',
                        bio: 'Preview how your bio looks to others',
                        note: 'For non-bleh users, multiple lines display as spaces and links, bold, italics will be plain text. Any images embedded will appear as manic text, so be aware.'
                    },
                    banner_tip:
                        'Images can be embedded using ![](link). You can also set a custom profile banner with ![banner](link).',
                    avatar: {
                        name: 'Edit avatar',
                        upload: 'Upload file',
                        delete: 'Delete avatar'
                    }
                },
                charts: {
                    name: 'Charts',
                    recent: {
                        count: {
                            name: 'Tracks to display'
                        },
                        artwork: {
                            name: 'Display album artwork'
                        },
                        realtime: {
                            name: 'Update tracks in realtime',
                            bio: 'Your recent tracks will refresh while you are on your profile.'
                        }
                    },
                    artists: {
                        timeframe: {
                            name: 'Default timeframe'
                        },
                        style: {
                            name: 'Chart style'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    albums: {
                        timeframe: {
                            name: 'Default timeframe'
                        },
                        style: {
                            name: 'Chart style'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    tracks: {
                        count: {
                            name: 'Tracks to display'
                        },
                        timeframe: {
                            name: 'Default timeframe'
                        }
                    }
                },
                ignore: {
                    name: 'Communication',
                    consider: {
                        name: 'To consider',
                        good: [
                            'You will not see previous or new shouts globally',
                            'They cannot direct message you',
                            'They cannot leave a shout on your profile or under your shouts anywhere'
                        ],
                        bad: [
                            'You cannot delete pre-existing shouts from your profile',
                            'They can still view your profile'
                        ]
                    },
                    view: 'View {c} more',
                    count: 'You have {c} users hidden'
                },
                privacy: {
                    name: 'Privacy',
                    recent_listening: {
                        name: 'Hide your recent listening history',
                        bio: 'Keep your recent listens a secret o.O'
                    },
                    receiving_msgs: {
                        name: 'Control who can interact with you',
                        bio: 'This setting controls who can post shouts and message you privately.',
                        settings: {
                            everyone: {
                                name: 'Everyone not hidden',
                                bio: 'Everyone except who you have ignored'
                            },
                            neighbours: {
                                name: 'Who you follow and neighbours',
                                bio: 'Everyone who you have chosen to follow, along with your Last.fm neighbours'
                            },
                            follow: {
                                name: 'Who you follow only',
                                bio: 'Only users who you have chosen to follow'
                            }
                        }
                    },
                    disable_shoutbox: {
                        name: 'Hide your shoutbox',
                        bio: 'Your shoutbox will be hidden for you and anyone else.'
                    }
                }
            },
            actions: {
                import: {
                    name: 'Import',
                    modals: {
                        initial: {
                            name: 'Import settings from a previous install',
                            alert: 'Anything you import will override your current settings, if you are importing settings from online ensure you trust the source.'
                        },
                        failed: {
                            name: 'Import failed',
                            alert: 'The settings you attempted to import failed to parse, no changes were made.'
                        }
                    }
                },
                export: {
                    name: 'Export',
                    modals: {
                        initial: {
                            name: 'Export your current settings',
                            alert: 'Your current settings are in the textbox below ready for you to copy.'
                        }
                    }
                },
                reset: {
                    name: 'Reset',
                    modals: {
                        initial: {
                            name: 'Reset your settings to default',
                            alert: 'Your settings will be <strong>reset to all defaults</strong> with no way to go back. Are you sure?',
                            confirm: 'Yes, reset my settings',
                            export: 'Export first'
                        }
                    }
                }
            }
        },
        shout: {
            name: 'Shout',
            sent: 'Sent!'
        },
        setup: {
            start: {
                name: 'hello {m}!!',
                thanks: 'Thank you for installing',
                info: [
                    'This is the first-time setup to help you get started with common tasks for new users, which include:',
                    'Manage accessibility, such as reduced motion',
                    'Configuring your accent colour',
                    'Changing your interface theme',
                    'Adjusting song corrections and tagging',
                    "If you're already set, you can skip."
                ],
                pick_theme: 'Which theme would you prefer?',
                change_later: 'You can modify all your settings at any time.'
            },
            appearance: {
                name: 'Your colour',
                bio: 'Configure the colour of bleh from one of the available presets, or make your own colour combination!',
                subtext:
                    'During seasonal events, the default colour changes automatically.'
            },
            music: {
                change_later: 'More detailed options available in settings.'
            }
        },
        gallery: {
            tabs: {
                overview: 'All',
                bookmarks: 'Saved'
            },
            bookmarks: {
                name: 'Saved',
                bio: 'Gallery photos can be saved for future reference.',
                no_data: 'no images saved (・・ )',
                link: 'View all saved photos',
                button: {
                    image_is_bookmarked: {
                        name: 'You have saved this image'
                    },
                    bookmark_this_image: {
                        name: 'Save',
                        bio: 'Save this image for later'
                    },
                    unbookmark_this_image: {
                        name: 'Unsave',
                        bio: 'Unsave this image'
                    }
                }
            },
            empty: {
                title: 'No title',
                description: 'No description'
            },
            prefer: {
                name: 'Star'
            },
            report: {
                name: 'Report'
            },
            open: {
                name: 'Expand',
                tooltip: 'Expand image to full resolution'
            },
            up: 'Up votes:',
            down: 'Down votes:',
            vote: 'This is the sum of votes used for ordering.',
            view: 'View photos'
        },
        activities: {
            name: 'Recent Activity',

            test: 'TEST {involved}',
            shout: 'Shout',
            image_upload: 'Uploaded image',
            image_star: 'Starred image',
            obsess: 'Obsessed',
            unobsess: 'Removed obsession',
            love: 'Loved',
            unlove: 'Removed love',
            install_bwaa: 'Installed bwaa',
            update_bwaa: 'Updated bwaa',
            install_bleh: 'Installed bleh',
            update_bleh: 'Updated bleh',
            bookmark: 'Bookmarked',
            unbookmark: 'Removed bookmark',
            wiki: 'Edited wiki'
        },
        artist: {
            name: 'Artist',
            plural: 'Artists',
            tooltip: 'Multiple artists are combined into this profile.'
        },
        album: {
            name: 'Album',
            plural: 'Albums'
        },
        track: {
            name: 'Track',
            plural: 'Tracks'
        },
        tag: {
            name: 'Tag'
        },
        search: {
            name: 'Search',
            results_for: 'Results for {v}'
        },
        inbox: {
            name: 'Inbox',
            overview: 'Messages',
            sent_overview: 'Messages',
            compose: 'Messages',
            message_overview: 'Messages',
            sent_message: 'Messages',
            notifications: 'Notifications'
        },
        charts: {
            name: 'Charts',
            overview: 'Real time',
            weekly: 'Weekly',
            charts_for: 'Charts for {date}',
            view: 'View the charts',
            scroll: {
                name: 'Simulate horizontal scrolling',
                bio: 'Disable if you can scroll easily on a laptop for example.'
            }
        },
        bookmarks: {
            name: 'Bookmarks'
        },
        home: {
            name: 'Home',
            welcome: 'Welcome back {m}'
        },
        nag_bar: {
            corrections: {
                title: 'Redirected from'
            }
        }
    },
    de: {
        badges: {
            missing: {
                name: 'Kein Abzeichen'
            },
            'user-status-subscriber': {
                name: 'Last.fm Pro',
                reason: 'Aktives Pro Abonnement'
            },
            'user-status-staff': {
                name: 'Angestellter',
                reason: 'Angestellter von Last.fm'
            },
            'label--fade': {
                reason: '-'
            },
            contributor: {
                name: 'bleh Mitwirkender',
                reason: 'Hat bei bleh mitgewirkt über code oder übersetzungen'
            },
            translation: {
                reason: 'Hat für eine unterstützte Sprache übersetzt'
            },
            cat: {
                name: 'ein Kätzchen!!!'
            },
            sponsor: {
                name: 'Sponsor',
                reason: 'Hat bleh und bwaa gesponsert :3'
            },
            cute: {
                reason: 'Für besondere Beutzer reserviert'
            },
            reserved: {
                reason: 'Für bestimmte Beutzer reserviert'
            }
        },
        avatar_for_me: 'Dein Avatar',
        avatar_for_user: 'Avatar für ',
        actions: {
            view_profile: 'View profile',
            view_library: 'Library',
            leave_a_shout: 'Shouts'
        },
        lotus: {
            artist: 'Artist corrections have been downloaded!',
            album_track: 'Album and track corrections have been downloaded!',
            version: 'You are running lotus version {v}.',
            tooltip:
                'lotus is the community correction system used in bleh and bwaa',
            check: 'Check for updates',
            correct: {
                name: 'Correct capitalisation',
                tooltip: 'Submit name correction',
                tooltip_active: 'Active name correction'
            }
        },
        glacier: {
            name: 'Library refresh',
            by_artist: ' von {a}',
            meta: {
                artists: 'Künstler',
                albums: 'Alben',
                tracks: 'Titel',
                average: 'Average'
            },
            view: {
                grid: 'Gitter',
                list: 'Liste',
                line: 'Liniendiagramm',
                pie: 'Kreis',
                bar: 'Balken'
            },
            axis: {
                horizontal: 'Horizontal',
                vertical: 'Vertikal'
            },
            dates: {
                last_year: 'Letztes Jahr',
                this_year: 'Dieses Jahr'
            },
            edit: 'Editieren',
            delete: 'Loeschen',
            love: 'Love',
            bulk_edit: 'Massenbearbeitung',
            option: {
                name: 'Use new graphs in library',
                bio: 'This can add a little amount of slow-down in some cases but with the benefit of awesome graphs.'
            }
        },
        changelog: {
            name: 'What’s New?',
            subtitle: 'from {u}',
            type: {
                major: 'Major release',
                minor: 'Minor release',
                general: 'General improvements',
                fix: 'Bug fix'
            },
            latest: 'Latest',
            view_major: 'View latest major release'
        },
        auth_menu: {
            dev: 'Entwicklermodus ein-/ausschalten',
            configure_bleh: 'bleh konfigurieren',
            library: 'Bibliothek',
            shouts: 'Shouts',
            obsessions: 'Obsessionen',
            labs: 'Labs',
            bookmarks: 'Lesezeichen',
            settings: 'Einstellungen',
            logout: 'Abmelden'
        },
        music: {
            submit_lastfm_correction: 'Submit correction to Last.fm',
            search_variations: {
                name: 'Search',
                tooltip: 'Search for variations of this title'
            },
            search_genius: 'Search lyrics',
            fetch_plays: {
                name: 'Titelliste',
                info: 'Sourced from your own plays as an official tracklist is unavailable',
                loading: 'Deine Wiedergaben auf diesem Album werden abgerufen',
                fail: 'Du hast keine Scrobbel auf diesem Album',
                open_as_track: 'Albumtitel als Titel öffnen'
            },
            from_the_album: 'Aus dem Album: {album}',
            listens: {
                count_listens: '{c} scrobbels',
                loading_listens: 'scrobbels',
                other_listeners: '{c} hörer',
                custom: {
                    tooltip: 'Pick a user',
                    name: 'View listens from another user'
                }
            },
            wiki: 'Über',
            wiki_edit: 'wiki editieren',
            wiki_read: 'mehr erfahren',
            refresh: 'Neu laden',
            refresh_tracks: 'Titel aktualisieren',
            menu: 'Extra options',
            obsession: 'Obsess',
            obsession_first: 'First to claim this obsession!',
            compare: {
                name: 'Compare',
                header: 'Compare plays'
            },
            about: 'About',
            about_guests: 'Others featured',
            view_profile: 'View profile'
        },
        error: {
            name: 'This page is missing...',
            go_back: 'Go back',
            visit_profile: 'Visit profile',
            try_again: 'Try again'
        },
        statistics: {
            scrobbles: {
                name: 'Deine Scrobbels'
            },
            plays: {
                name: 'scrobbels'
            }
        },
        profile: {
            name: 'Profil',
            on_ignore_list: 'Du stehst auf der Ignorierliste dieses Benutzers.',
            friends: {
                name: 'Freunde'
            },
            display_name: {
                aka: 'aka.',
                pronouns: 'pronomen'
            },
            created: {
                name: 'erstellt',

                replace: '• scrobbelt seit '
            },
            edit: 'Profil bearbeiten',
            obsess: 'Obsess',
            message: 'Anschreiben',
            shortcut: {
                add: 'Verknüpfung',
                remove: 'Verknüpfung'
            },
            scrobbles: 'Scrobbels',
            artists: 'Künstler',
            loved: 'Lieblingslieder',
            taste: 'Taste similarity',
            taste_meter: {
                level: {
                    super: 'Super',
                    very_high: 'Very High',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                    very_low: 'Very Low',
                    unknown: 'Unknown'
                },
                you_share_1: 'Ihr hört beide {artist}',
                you_share_2: 'Ihr hört beide {artist1}, {artist2}',
                you_share_3: 'Ihr hört beide {artist1}, {artist2}, {artist3}'
            },
            open_avatar: 'Im neuen Fenster öffnen',
            settings: 'Konfigurieren',
            events: 'Events',
            top_badge: 'Top-Abzeichen',
            progress: {
                to_go: 'Noch {s} scrobbels',
                tier: 'Stufe {t}',
                explain: 'Für jede Stufe schaltest du ein neues Abzeichen frei'
            }
        },
        event: {
            name: 'Event',
            going: '{c} going',
            maybe: '{c} interested',
            you_know: 'Who you know',
            all_time: 'All time',
            total: '{c} total'
        },
        messaging: {
            update: 'bleh wurde auf Version {v} aktualisiert!'
        },
        wiki: {
            latest: 'View latest version',
            syntax: {
                name: 'Use fancy syntax when editing',
                links_to: 'Links to {link}'
            },
            presets: {
                name: 'Symbol presets'
            }
        },
        settings: {
            name: 'Einstellungen',
            save: 'Speichern',
            cancel: 'Abbrechen',
            close: 'Schließen',
            clear: 'Leeren',
            create: 'Create',
            add: 'Add',
            remove: 'Remove',
            done: 'Fertig',
            finish: 'Beenden',
            continue: 'Fortsetzen',
            reset: 'Auf Werkseinstellung Zurücksetzen',
            go: 'Fortfahren',
            skip: 'Überspringen',
            back: 'Zurück',
            right_click: 'Right-click for more options',
            reload: {
                name: 'Refresh pending',
                body: 'Klicke zum Neuladen, um deine Einstellungen zu übernehmen.'
            },
            new: 'Neu',
            beta: 'Beta',
            configure: 'Konfigurieren',
            pages: {
                overview: 'Profil',
                privacy: 'Datenschutz',
                account_overview: 'Konto',
                website: 'Website',
                subscription_overview: 'Pro',
                applications_overview: 'Apps'
            },
            examples: {
                button: 'Beispiel-Taste'
            },
            skip_to: {
                name: 'Skip to'
            },
            home: {
                name: 'Startseite',
                brand: 'bleh',
                version: 'Version {v}',
                recommended: 'Empfohlene Einstellungen',
                issues: {
                    name: 'Probleme',
                    bio: 'Bugs reporten'
                },
                update: {
                    name: 'Aktualisierungen',
                    css: 'Stylesheet aktualisieren',
                    bio: 'Jetzt prüfen',
                    notice: 'There are updates available!',
                    ignore: 'Ignore temporarily',

                    update_now: 'Update now',
                    update_to_v: 'Update to {v}'
                },
                setup: {
                    name: 'Setup',
                    bio: 'Re-enter setup'
                },
                colours: {
                    name: 'Farbe',
                    bio: 'Pick your favourite!'
                },
                thanks: 'Willkommen {m}, du verwendest bleh Version {v}.',
                sponsor: {
                    name: 'Sponsor',
                    header: 'Sponsor the development of bleh and bwaa',
                    bio: 'If you feel my work on these projects is worthy of donations you are welcome to sponsor me on GitHub. This is of course optional and bleh will forever be open-source and free.',
                    thanks: 'Thank you for sponsoring {m}, you are running bleh version {v}.',
                    status: {
                        yes: 'You are a sponsor, thank you!',
                        no: 'Become a sponsor to get a custom badge',
                        badge: 'To configure your custom badge, get in touch with me.',
                        one_time:
                            'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version:
                        'You have version {v} of the sponsorship/badge data downloaded.'
                }
            },
            appearance: {
                name: 'Aussehen'
            },
            themes: {
                name: 'Farbschema',
                bio: 'Choose from light to midnight.',
                dark: {
                    name: 'Dunkel',
                    bio: 'The default flavour of bleh'
                },
                darker: {
                    name: 'Dunkler',
                    bio: 'The in-between'
                },
                oled: {
                    name: 'Mitternacht',
                    bio: 'Ultra blackout'
                },
                light: {
                    name: 'Hell',
                    bio: 'Low saturation and bright'
                },
                classic: {
                    name: 'Classic',
                    bio: 'Re-live early computing'
                }
            },
            music: {
                name: 'Musik',
                header: 'Musikkonfiguration',
                bio: 'Konfiguriere deine musikbezogene Einstellungen für Profile, Künstler:innen, Alben und Titel.',
                profile_shortcut: {
                    name: 'Profilverknüpfung',
                    bio: 'Schnell auf die Wiedergaben eines Benutzers auf einer Künstler-, Album- oder Titelseite zugreifen.',
                    placeholder: 'Profil',
                    header: 'Benutzernamen eingeben',
                    saved: 'Die Profilverknüpfung ist gültig',
                    failed: 'Das Profil existiert nicht oder konnte nicht geladen werden.'
                },
                show_bulk_edit_album: {
                    name: 'Show album in chartlists',
                    bio: 'This is disabled by default as hovering over tracks reveals the album title in all areas',
                    require:
                        'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Zugänglichkeit',
                shout_preview:
                    'some completely random text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                accessible_name_colours: {
                    name: 'Zugängliche Namensfarben bevorzugen',
                    bio: 'Use the default header text colour over a accented text colour.'
                },
                underline_links: {
                    name: 'Links immer unterstreichen',
                    bio: 'Make links to interactables stand out.'
                },
                reduced_motion: {
                    name: 'Animationen reduzieren',
                    bio: 'Will in most cases either slowly fade or hard-cut, no scaling.'
                },
                toggle_icon: {
                    name: 'Add indicator icon to toggles',
                    bio: 'Display a checkmark or a cross depending on toggle state.'
                }
            },
            layout: {
                name: 'Layout',
                header: 'Manage header layout',
                avatar_action: {
                    name: 'Default avatar action',
                    bio: 'What do you want to happen when you click avatars?',
                    gallery: 'View photos (or featured album for tracks)',
                    album: 'View featured album'
                }
            },
            customise: {
                name: 'Anpassen',
                colours: {
                    name: 'Farbe',
                    presets: 'Voreinstellungen',
                    manual: 'Anleitung',
                    custom: 'Erstelle eine eigene Farbe',
                    default_with_season: 'Standardfarbe für {season}',
                    default: 'Standardfarbe',
                    modals: {
                        custom_colour: {
                            preface:
                                'Farben werden durch drei Werte gesteuert: Farbton, Sättigung und Helligkeit. Probiere den Schieberegler aus, um ein Gefühl dafür zu bekommen.',
                            hue: 'Akzentfarbe',
                            sat: 'Sättigung',
                            lit: 'Helligkeit',
                            seasonal_alert:
                                'Die aktuelle Saison überschreibt deine Akzentfarbe. Passe den Schieberegler an, um sie zu deaktivieren.'
                        }
                    }
                },
                high_contrast: {
                    name: 'Enable high contrast mode'
                },
                seasonal: {
                    name: 'Saisonal',
                    timeline: 'Seasonal timeline',
                    bio: 'Während saisonaler Ereignisse kann bleh automatisch die Standardakzentfarbe ändern, Partikel hinzufügen und verschiedenen Schnittstellenelementen Overlays hinzufügen.',
                    info: 'Seasonal events try to match your timezone, for reference we calculated {offset}',
                    started: 'Gestartet',
                    ends_in: 'Endet in',
                    listing: {
                        none: 'No active season',
                        easter: 'Ostern',
                        pride: 'Pride',
                        halloween: 'Halloween',
                        pre_fall: 'Vorherbst',
                        fall: 'Herbst',
                        christmas: 'Weihnachten',
                        new_years: 'Silvester'
                    },
                    option: {
                        name: 'Saisonales Eventsystem aktivieren'
                    },
                    marker: {
                        current: 'Die aktuelle Saison ist {season} für {time}',
                        started: '{time} angefangen',
                        none: 'Derzeit gibt es keine aktive Saison.',
                        disabled:
                            'Saisons sind deaktiviert. Aktiviere diese, um die aktuelle Saison anzuzeigen.'
                    },
                    particles: {
                        name: 'Partikel während bestimmter Jahreszeiten anzeigen',
                        bio: 'Während der Wintersaison gibt es Schneeflocken!'
                    },
                    show_less_particles: {
                        name: 'Display a reduced number of particles'
                    },
                    fps_particles: {
                        name: 'Display particles without fancy effects',
                        bio: 'This might be more demanding on some systems'
                    },
                    overlays: {
                        name: 'Zusätzliche saisonale Effekte anzeigen',
                        bio: 'During winter seasons this is used for ice effects, otherwise mainly just gradients.'
                    },
                    announce: 'It is now {s}!',
                    nonsense: 'A Nonsense Christmas',
                    fruitcake: 'fruitcake',
                    mistletoe: 'Mistletoe',
                    festival: 'Christmas Eve',
                    exclusive_for_season:
                        'Exclusive for <span class="season-name">{season}</span>',
                    exclusive_for_season_and_more:
                        'Exclusive for <span class="season-name">{season}</span> and 1 more',
                    view: 'Open seasonal tab'
                },
                artwork: {
                    name: 'Cover'
                },
                hue_from_album: {
                    name: 'Albumseiten automatisch färben',
                    bio: 'Wählt die Primärfarbe eines Albumcovers aus, um die Seite zu bemalen.'
                },
                gloss: {
                    name: 'Gloss overlay',
                    bio: 'Apply flair to all cover arts.'
                },
                display: {
                    name: 'Anzeigeeinstellungen'
                },
                colourful_counts: {
                    name: 'Verwende einen Farbverlauf für die Allzeitdiagramme',
                    bio: 'Weist eine Farbe aus dem Farbverlauf zu, basierend auf der insgesamten Anzahl der Scrobbels für einen Künstler.'
                },
                colourful_tracks: {
                    name: 'Colour actively scrobbling tracks based on album art',
                    bio: 'Picks the primary colour from the associated cover to paint the track.'
                },
                gendered_tags: {
                    name: 'Geschlechtsspezifische Tags ausblenden',
                    bio: 'Geschlechtsspezifische Tags sind normalerweise überflüssig.'
                },
                rain: {
                    name: 'Let it rain!',
                    bio: 'rain :3c (may have performance impacts !! also may look bad !!)'
                },
                show_your_progress: {
                    name: 'Show your weekly progress',
                    bio: 'too many numbers ~w~'
                },
                profile_header: {
                    name: 'Profilhintergründe anzeigen',
                    see_type: 'Source from avatar instead of top artist',
                    view_on: 'View backgrounds on',
                    for_own: 'Auf meinem Profil',
                    for_others: 'Auf anderen Profilen'
                },
                sat_bg: {
                    name: 'Card background saturation',
                    bio: 'Control the colour of backgrounds in addition to main accent'
                }
            },
            activities: {
                name: 'Activities',
                bio: 'Track your most recent activities locally on your profile.',
                toggle: {
                    name: 'Enable activity tracking',
                    bio: 'Events will only be registered and displayed while enabled.'
                },
                types: {
                    shout: 'Shouts',
                    image: 'Image uploads and interactions',
                    obsess: 'Track obsessions',
                    love: 'Track love',
                    install: 'Installing and updating',
                    wiki: 'Wiki editing'
                }
            },
            performance: {
                name: 'Fehlerbehebung',
                bio: 'Running into noticeable issues in theme loading? Try out these settings.',
                dev: {
                    name: 'Disable in-built theme loading',
                    bio: 'This allows you to load the in-built theme via Stylus instead, which may be more performant.',
                    modals: {
                        prompt: {
                            alert: 'Once you refresh the page, the in-built bleh theme will be disabled (unless you disable this option again).',
                            stylus: 'If you do not already have the <strong>Stylus</strong> extension, choose your browser below:',
                            browsers: {
                                chrome: {
                                    name: 'Chrome',
                                    bio: 'for Chrome, Edge, Brave, Opera'
                                },
                                firefox: {
                                    name: 'Firefox',
                                    bio: 'for Firefox only'
                                }
                            }
                        },
                        continue: {
                            next_step:
                                'Once you have the extension installed, hit "Install style" on the new tab that will open.'
                        },
                        finish: {
                            alert: 'All done! From now on, styling will be handled via Stylus.'
                        }
                    }
                },
                bug: {
                    name: 'Something wrong?',
                    bio: 'Report a bug in the bleh repo to get it fixed.'
                }
            },
            profiles: {
                name: 'Profil',
                bio: 'Manage your personal data and data stored on other profiles.',
                notes: {
                    name: 'Notes',
                    header: 'Note',
                    placeholder: 'Enter a local note for this user',
                    edit: 'Edit note',
                    delete: 'Remove note',
                    edit_user: "Edit {u}'s note",
                    delete_user: "Remove {u}'s note",
                    view: 'View your profile notes'
                },
                you: 'You'
            },
            redirects: {
                name: 'Weiterleitungen',
                bio: "Manage last.fm's (not) handy redirection system as best as possible.",
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: "No, I didn't mean Travi$ Scott"
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: "By default, last.fm will 'auto-correct' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.",
                    action: 'Open Settings'
                }
            },
            corrections: {
                name: 'Korrekturen',
                bio: 'Verwalte das Korrektursystem von bleh für Künstler-, Album- und Titel.',
                toggle: {
                    name: 'Aktiviere das Korrektursystem'
                },
                view: {
                    name: 'Aktuelle Korrekturen anzeigen',
                    bio: 'Lists all active in your install'
                },
                formatting: 'Smarte Musiktitel',
                format_guest_features: {
                    name: 'Formatiere Features und Song-Tags',
                    bio: 'Teilt Titel und Albentitel in einzelne Tags auf, beispielsweise Features, Versionen, Remixe.'
                },
                show_guest_features: {
                    name: 'Features im Titel und Künstler anzeigen',
                    bio: 'Durch deaktivieren werden sie von Titeln entfernt und das Künstlerfeld wird bevorzugt.'
                },
                stacked_chartlist_info: {
                    name: 'Name und Titel stapeln',
                    bio: 'Beide passen sich an den Streaming-Diensten an und erhöht die Länge dieser.'
                },
                show_remaster_tags: {
                    name: 'Remaster-Tags anzeigen',
                    bio: "Nobody likes remasters (or the tags), if you'd prefer to still listen but remove the annoyance hide them!"
                },
                submit: {
                    name: 'Neue Korrektur einreichen',
                    bio: 'Have a name that you feel is capitalised wrong?',
                    action: 'Submit'
                },
                listing: {
                    artists: 'Künstler',
                    albums_tracks: 'Alben und Titel'
                }
            },
            language: {
                name: 'Sprache',
                supported: 'Unterstützt von bleh',
                by: 'von {users}',
                submit: {
                    name: 'Sprichst du fließend eine andere Sprache?',
                    bio: 'Übersetzungen werden ausschließlich von der Community beigesteuert.',
                    action: 'Übersetzung einreichen'
                }
            },
            text: {
                name: 'Text',
                shout_preview_md:
                    'some <strong>completely</strong> random!<br>text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                shout_preview:
                    "some completely random! text that doesn't mean anything at all",
                markdown: {
                    name: 'Markdown-Formatierung verwenden',
                    bio: 'Aktiviert Zeilenumbrüche, Fettdruck, Kursivschrift und Links.',
                    shouts: 'In Shouts',
                    profile: 'In Profilbiografien'
                },
                font: {
                    name: 'Font settings',
                    placeholder: 'Font name(s), separated by commas'
                },
                font_weight: {
                    name: 'Font weight',
                    bio: 'Used for most regular text'
                },
                font_weight_medium: {
                    name: 'Medium font weight',
                    bio: 'Used for bold text'
                },
                font_weight_bold: {
                    name: 'Bold font weight',
                    bio: 'Used for larger text such as headers'
                },
                font_emoji: {
                    name: 'Use compatibility emoji font',
                    bio: 'On Windows systems prior to 11, the emoji font is majorly outdated unless this option is used. (such as 🏳️‍⚧️)'
                }
            },
            inbuilt: {
                profile: {
                    name: 'Profil',
                    subtitle: {
                        name: 'Untertitel'
                    },
                    pronoun_tip:
                        'Wenn Pronomen an den Anfang gestellt werden, ändert sich „aka.“ in „Pronomen“.',
                    country: 'Land',
                    website: 'Website',
                    about: 'Über mich',
                    toggle_preview: {
                        name: 'Vorschau umschalten',
                        bio: 'Vorschau deiner biographie für andere',
                        note: 'Für nicht bleh Benutzer, mehrere Zeilen werden als Leerzeichen und Links angezeigt, Fett- und Kursivschrift wird als einfacher Text angezeigt. Jegliche eingelegte Bilder werden als Text angezeigt.'
                    },
                    banner_tip:
                        'Bilder können mithilfe von ![](link) eingelegt werden. Du kannst auch ein benutzerdefiniertes Banner mithilfe von ![banner](link) festlegen.',
                    avatar: {
                        name: 'Profilbild bearbeiten',
                        upload: 'Datei hochladen',
                        delete: 'Profilbild löschen'
                    }
                },
                charts: {
                    name: 'Charts',
                    recent: {
                        count: {
                            name: 'Tracks to display'
                        },
                        artwork: {
                            name: 'Display album artwork'
                        },
                        realtime: {
                            name: 'Update tracks in realtime',
                            bio: 'Your recent tracks will refresh while you are on your profile.'
                        }
                    },
                    artists: {
                        timeframe: {
                            name: 'Default timeframe'
                        },
                        style: {
                            name: 'Chart style'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    albums: {
                        timeframe: {
                            name: 'Default timeframe'
                        },
                        style: {
                            name: 'Chart style'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    tracks: {
                        count: {
                            name: 'Tracks to display'
                        },
                        timeframe: {
                            name: 'Default timeframe'
                        }
                    }
                },
                ignore: {
                    name: 'Communication',
                    consider: {
                        name: 'To consider',
                        good: [
                            'You will not see previous or new shouts globally',
                            'They cannot direct message you',
                            'They cannot leave a shout on your profile or under your shouts anywhere'
                        ],
                        bad: [
                            'You cannot delete pre-existing shouts from your profile',
                            'They can still view your profile'
                        ]
                    },
                    view: 'View {c} more',
                    count: 'You have {c} users hidden'
                },
                privacy: {
                    name: 'Datenschutz',
                    recent_listening: {
                        name: 'Hide your recent listening history',
                        bio: 'Keep your recent listens a secret o.O'
                    },
                    receiving_msgs: {
                        name: 'Control who can interact with you',
                        bio: 'This setting controls who can post shouts and message you privately.',
                        settings: {
                            everyone: {
                                name: 'Everyone',
                                bio: 'Everyone except who you have ignored'
                            },
                            neighbours: {
                                name: 'Who you follow and neighbours',
                                bio: 'Everyone who you have chosen to follow, along with your Last.fm neighbours'
                            },
                            follow: {
                                name: 'Who you follow only',
                                bio: 'Only users who you have chosen to follow'
                            }
                        }
                    },
                    disable_shoutbox: {
                        name: 'Hide your shoutbox',
                        bio: 'Your shoutbox will be hidden for you and anyone else.'
                    }
                }
            },
            actions: {
                import: {
                    name: 'Import',
                    modals: {
                        initial: {
                            name: 'Import settings from a previous install',
                            alert: 'Anything you import will override your current settings, if you are importing settings from online ensure you trust the source.'
                        },
                        failed: {
                            name: 'Import failed',
                            alert: 'The settings you attempted to import failed to parse, no changes were made.'
                        }
                    }
                },
                export: {
                    name: 'Export',
                    modals: {
                        initial: {
                            name: 'Export your current settings',
                            alert: 'Your current settings are in the textbox below ready for you to copy.'
                        }
                    }
                },
                reset: {
                    name: 'Zurücksetzen',
                    modals: {
                        initial: {
                            name: 'Reset your settings to default',
                            alert: 'Your settings will be <strong>reset to all defaults</strong> with no way to go back. Are you sure?',
                            confirm: 'Yes, reset my settings',
                            export: 'Export first'
                        }
                    }
                }
            }
        },
        setup: {
            start: {
                name: 'haiii :3 welcome to bleh!!',
                thanks: 'Thank you for installing, {m}',
                info: [
                    'This is the first-time setup to help you get started with common tasks for new users, which include:',
                    'Manage accessibility, such as reduced motion',
                    'Configuring your accent colour',
                    'Changing your interface theme',
                    'Adjusting song corrections and tagging',
                    "If you're already set, you can skip."
                ]
            },
            appearance: {
                bio: 'Configure the colour of bleh from one of the available presets, or make your own colour combination!',
                subtext:
                    'During seasonal events, the default colour changes automatically.'
            }
        },
        gallery: {
            tabs: {
                overview: 'Fotos',
                bookmarks: 'Saved'
            },
            bookmarks: {
                name: 'Saved',
                bio: 'Gallery photos can be saved for future reference.',
                no_data: 'no images saved (・・ )',
                link: 'Alle favorisierten Bilder ansehen',
                button: {
                    image_is_bookmarked: {
                        name: 'You have saved this image'
                    },
                    bookmark_this_image: {
                        name: 'Speichern',
                        bio: 'Dieses Bild speichern'
                    },
                    unbookmark_this_image: {
                        name: 'Unsave',
                        bio: 'Dieses Bild nicht mehr speichern'
                    }
                }
            },
            empty: {
                title: 'No title',
                description: 'No description'
            },
            prefer: {
                name: 'Star'
            },
            report: {
                name: 'Melden'
            },
            open: {
                name: 'Vergrößern',
                tooltip: 'Dieses Bild auf gesamter Auflösung vergrößern'
            },
            up: 'Plusstimmen:',
            down: 'Minusstimmen:',
            vote: 'This is the sum of votes used for ordering.',
            view: 'Fotos anzeigen'
        },
        activities: {
            name: 'Kürzliche Aktivitäten',

            test: 'TEST {involved}',
            shout: 'Shout hinterlassen',
            image_upload: 'Bild hochgeladen',
            image_star: 'Bild favorisiert',
            obsess: 'Obsessed',
            unobsess: 'Nicht mehr obsessed',
            love: 'Liebst',
            unlove: 'Liebst nicht mehr',
            install_bwaa: 'bwaa installiert',
            update_bwaa: 'bwaa aktualisiert',
            install_bleh: 'bleh installiert',
            update_bleh: 'bleh aktualisiert',
            bookmark: 'Lesezeichen hinzugefügt',
            unbookmark: 'Lesezeichen entfernt',
            wiki: 'Wiki editiert'
        },
        artist: {
            name: 'Künstler',
            plural: 'Künstler',
            tooltip: 'Multiple artists are combined into this profile.'
        },
        album: {
            name: 'Album',
            plural: 'Alben'
        },
        track: {
            name: 'Titel',
            plural: 'Titel'
        },
        tag: {
            name: 'Tag'
        },
        search: {
            name: 'Suche',
            results_for: 'Results for {v}'
        },
        inbox: {
            name: 'Inbox',
            overview: 'Messages',
            sent_overview: 'Messages',
            compose: 'Messages',
            message_overview: 'Messages',
            sent_message: 'Messages',
            notifications: 'Notifications'
        },
        charts: {
            name: 'Charts',
            overview: 'Real time',
            weekly: 'Weekly',
            charts_for: 'Charts for {date}',
            view: 'View the charts',
            scroll: {
                name: 'Simulate horizontal scrolling',
                bio: 'Disable if you can scroll easily on a laptop for example.'
            }
        },
        bookmarks: {
            name: 'Bookmarks'
        },
        home: {
            name: 'Home',
            welcome: 'Welcome back {m}'
        }
    },
    pl: {
        badges: {
            missing: {
                name: 'No badges'
            },
            'user-status-subscriber': {
                name: 'Last.fm Pro',
                reason: 'Active Pro subscription'
            },
            'user-status-staff': {
                name: 'Staff',
                reason: 'Staff member of Last.fm'
            },
            'label--fade': {
                reason: 'They follow you'
            },
            contributor: {
                name: 'bleh contributor',
                reason: 'Contributed to bleh via code or translations'
            },
            translation: {
                reason: 'Translated for a supported language'
            },
            cat: {
                name: "it's a kitty!!"
            },
            sponsor: {
                name: 'Sponsoring',
                reason: 'Sponsored bleh and bwaa :3'
            },
            cute: {
                reason: 'Reserved for special users'
            },
            reserved: {
                reason: 'Reserved for certain users'
            }
        },
        avatar_for_me: 'Your avatar',
        avatar_for_user: 'Avatar for ',
        actions: {
            view_profile: 'View profile',
            view_library: 'Library',
            leave_a_shout: 'Shouts'
        },
        lotus: {
            artist: 'Artist corrections have been downloaded!',
            album_track: 'Album and track corrections have been downloaded!',
            version: 'You are running lotus version {v}.',
            tooltip:
                'lotus is the community correction system used in bleh and bwaa',
            check: 'Check for updates',
            correct: {
                name: 'Correct capitalisation',
                tooltip: 'Submit name correction',
                tooltip_active: 'Active name correction'
            }
        },
        glacier: {
            name: 'Library refresh',
            by_artist: ' by {a}',
            meta: {
                artists: 'Artists',
                albums: 'Albums',
                tracks: 'Tracks',
                average: 'Average'
            },
            view: {
                grid: 'Grid',
                list: 'List',
                line: 'Line',
                pie: 'Pie',
                bar: 'Bar'
            },
            axis: {
                horizontal: 'Horizontal',
                vertical: 'Vertical'
            },
            dates: {
                last_year: 'Last year',
                this_year: 'This year'
            },
            edit: 'Edit',
            delete: 'Delete',
            love: 'Love',
            bulk_edit: 'Bulk edit',
            option: {
                name: 'Use new graphs in library',
                bio: 'This can add a little amount of slow-down in some cases but with the benefit of awesome graphs.'
            }
        },
        changelog: {
            name: 'What’s New?',
            subtitle: 'from {u}',
            type: {
                major: 'Major release',
                minor: 'Minor release',
                general: 'General improvements',
                fix: 'Bug fix'
            },
            latest: 'Latest',
            view_major: 'View latest major release'
        },
        auth_menu: {
            dev: 'Przełącz tryb deweloperski',
            configure_bleh: 'Skonfiguruj bleh',
            library: 'Library',
            shouts: 'Wiadomości',
            obsessions: 'Obsessions',
            labs: 'Labs',
            bookmarks: 'Bookmarks',
            settings: 'Settings',
            logout: 'Logout'
        },
        music: {
            submit_lastfm_correction: 'Submit correction to Last.fm',
            search_variations: {
                name: 'Search',
                tooltip: 'Search for variations of this title'
            },
            search_genius: 'Search lyrics',
            fetch_plays: {
                name: 'Tracklist',
                info: 'Sourced from your own plays as an official tracklist is unavailable',
                loading: 'Fetching your plays on this album',
                fail: 'You do not have any plays on this album',
                open_as_track: 'Open album title as a track'
            },
            from_the_album: 'From the album: {album}',
            listens: {
                count_listens: '{c} listens',
                loading_listens: 'listens',
                other_listeners: '{c} others',
                custom: {
                    tooltip: 'Pick a user',
                    name: 'View listens from another user'
                }
            },
            wiki: 'About',
            wiki_edit: 'edit wiki',
            wiki_read: 'read more',
            refresh: 'Refresh',
            refresh_tracks: 'Refresh tracks',
            menu: 'Extra options',
            obsession: 'Obsess',
            obsession_first: 'First to claim this obsession!',
            compare: {
                name: 'Compare',
                header: 'Compare plays'
            },
            about: 'About',
            about_guests: 'Others featured',
            view_profile: 'View profile'
        },
        error: {
            name: 'This page is missing...',
            go_back: 'Go back',
            visit_profile: 'Visit profile',
            try_again: 'Try again'
        },
        statistics: {
            scrobbles: {
                name: 'Twoje scrobble'
            },
            plays: {
                name: 'odtworzeń'
            }
        },
        profile: {
            name: 'Profile',
            on_ignore_list: 'Jesteś na liście ignorowanych tego użytkownika.',
            friends: {
                name: 'Friends'
            },
            display_name: {
                aka: 'aka.',
                pronouns: 'pronouns'
            },
            created: {
                name: 'created',

                replace: '• scrobbling since '
            },
            edit: 'Edit profile',
            obsess: 'Obsess',
            message: 'Private message',
            shortcut: {
                add: 'Add as shortcut',
                remove: 'Your profiles are linked!'
            },
            scrobbles: 'Scrobbles',
            artists: 'Artists',
            loved: 'Loved tracks',
            taste: 'Taste similarity',
            taste_meter: {
                level: {
                    super: 'Super',
                    very_high: 'Very High',
                    high: 'High',
                    medium: 'Medium',
                    low: 'Low',
                    very_low: 'Very Low',
                    unknown: 'Unknown'
                },
                you_share_1: 'You share {artist}',
                you_share_2: 'You share {artist1} and {artist2}',
                you_share_3: 'You share {artist1}, {artist2}, and {artist3}'
            },
            open_avatar: 'Open in a new tab',
            settings: 'Configure',
            events: 'Events',
            top_badge: 'Top Badge',
            progress: {
                to_go: '{s} scrobbles to go',
                tier: 'Tier {t}',
                explain: 'For each tier, you unlock a new badge'
            }
        },
        event: {
            name: 'Event',
            going: '{c} going',
            maybe: '{c} interested',
            you_know: 'Who you know',
            all_time: 'All time',
            total: '{c} total'
        },
        messaging: {
            update: 'bleh has updated to version {v}!'
        },
        wiki: {
            latest: 'View latest version',
            syntax: {
                name: 'Use fancy syntax when editing',
                links_to: 'Links to {link}'
            },
            presets: {
                name: 'Symbol presets'
            }
        },
        settings: {
            name: 'Settings',
            save: 'Zapisz',
            cancel: 'Anuluj',
            close: 'Zamknij',
            clear: 'Wyczyść',
            create: 'Create',
            add: 'Add',
            remove: 'Remove',
            done: 'Gotowe',
            finish: 'Finish',
            continue: 'Kontynuuj',
            reset: 'Przywróć domyślne',
            go: 'Go',
            skip: 'Skip',
            back: 'Back',
            right_click: 'Right-click for more options',
            reload: {
                name: 'Refresh pending',
                body: 'A setting you changed requires a page refresh to take effect.'
            },
            new: 'New',
            beta: 'Beta',
            configure: 'Configure',
            pages: {
                overview: 'Profile',
                privacy: 'Privacy',
                account_overview: 'Account',
                website: 'Website',
                subscription_overview: 'Pro',
                applications_overview: 'Applications'
            },
            examples: {
                button: 'Przycisk przykładowy'
            },
            skip_to: {
                name: 'Skip to'
            },
            home: {
                name: 'Strona główna',
                brand: 'bleh',
                version: 'Wersja {v}',
                recommended: 'Zalecane ustawienia',
                issues: {
                    name: 'Problemy',
                    bio: 'Zgłoś błędy'
                },
                update: {
                    name: 'Updates',
                    css: 'Update style',
                    bio: 'Check now',
                    notice: 'There are updates available!',
                    ignore: 'Ignore temporarily',

                    update_now: 'Update now',
                    update_to_v: 'Update to {v}'
                },
                setup: {
                    name: 'Setup',
                    bio: 'Re-enter setup'
                },
                colours: {
                    name: 'Kolory',
                    bio: 'Wybierz swój ulubiony!'
                },
                thanks: 'Welcome {m}, you are running bleh version {v}.',
                sponsor: {
                    name: 'Sponsor',
                    header: 'Sponsor the development of bleh and bwaa',
                    bio: 'If you feel my work on these projects is worthy of donations you are welcome to sponsor me on GitHub. This is of course optional and bleh will forever be open-source and free.',
                    thanks: 'Thank you for sponsoring {m}, you are running bleh version {v}.',
                    status: {
                        yes: 'You are a sponsor, thank you!',
                        no: 'Become a sponsor to get a custom badge',
                        badge: 'To configure your custom badge, get in touch with me.',
                        one_time:
                            'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version:
                        'You have version {v} of the sponsorship/badge data downloaded.'
                }
            },
            appearance: {
                name: 'Appearance'
            },
            themes: {
                name: 'Motywy',
                bio: 'Wybierz od jasnego do ciemnego.',
                dark: {
                    name: 'Ciemny',
                    bio: 'Domyślna wersja bleh'
                },
                darker: {
                    name: 'Ciemniejszy',
                    bio: 'Coś pomiędzy'
                },
                oled: {
                    name: 'Północny',
                    bio: 'Całkowita ciemność'
                },
                light: {
                    name: 'Jasny',
                    bio: 'Mało koloru i dużo światła'
                },
                classic: {
                    name: 'Classic',
                    bio: 'Re-live early computing'
                }
            },
            music: {
                name: 'Music',
                header: 'Music configuration',
                bio: 'Configure your music-related settings for profiles, artists, albums, and tracks.',
                profile_shortcut: {
                    name: 'Profile shortcut',
                    bio: "Quickly access a user's plays on an artist, album, or track page.",
                    placeholder: 'Profile',
                    header: 'Enter username',
                    saved: 'Profile shortcut is valid',
                    failed: 'Profile does not exist or failed to load'
                },
                show_bulk_edit_album: {
                    name: 'Show album in chartlists',
                    bio: 'This is disabled by default as hovering over tracks reveals the album title in all areas',
                    require:
                        'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Accessibility',
                shout_preview:
                    'jakikolwiek losowy tekst, który <a href="https://cutensilly.org">nic nie znaczy</a>',
                accessible_name_colours: {
                    name: 'Preferowane kolory dostępnej nazwy',
                    bio: 'Użyj domyślnego koloru tekstu nagłówka zamiast koloru akcentowego.'
                },
                underline_links: {
                    name: 'Zawsze podkreślaj linki',
                    bio: 'Podkreślaj linki do elementów interaktywnych.'
                },
                reduced_motion: {
                    name: 'Reduce animations around interfaces',
                    bio: 'Will in most cases either slowly fade or hard-cut, no scaling.'
                },
                toggle_icon: {
                    name: 'Add indicator icon to toggles',
                    bio: 'Display a checkmark or a cross depending on toggle state.'
                }
            },
            layout: {
                name: 'Layout',
                header: 'Manage header layout',
                avatar_action: {
                    name: 'Default avatar action',
                    bio: 'What do you want to happen when you click avatars?',
                    gallery: 'View photos (or featured album for tracks)',
                    album: 'View featured album'
                }
            },
            customise: {
                name: 'Dostosuj',
                colours: {
                    name: 'Kolory',
                    presets: 'Ustawienia wstępne',
                    manual: 'Ręcznie',
                    custom: 'Stwórz niestandardowy kolor',
                    default_with_season: 'Default colour for {season}',
                    default: 'Default colour',
                    modals: {
                        custom_colour: {
                            preface:
                                'Kolory są kontrolowane przez trzy wartości: odcień (hue), nasycenie (saturation) i jasność (lightness). Przesuń suwaki, aby dostosować kolor.',
                            hue: 'Kolor akcentu (hue)',
                            sat: 'Nasycenie (saturation)',
                            lit: 'Jasność (lightness)',
                            seasonal_alert:
                                'The current season is overriding your accent colour, adjust sliders to disable.'
                        }
                    }
                },
                high_contrast: {
                    name: 'Enable high contrast mode'
                },
                seasonal: {
                    name: 'Seasonal',
                    timeline: 'Seasonal timeline',
                    bio: 'During seasonal events, bleh can automatically change the default accent colour, add particles, and add overlays to various interface elements.',
                    info: 'Seasonal events try to match your timezone, for reference we calculated {offset}',
                    started: 'Started',
                    ends_in: 'Ends in',
                    listing: {
                        none: 'No active season',
                        easter: 'Easter',
                        pride: 'Pride',
                        halloween: 'Halloween',
                        pre_fall: 'Pre-Fall',
                        fall: 'Fall',
                        christmas: 'Christmas',
                        new_years: 'New Years'
                    },
                    option: {
                        name: 'Enable seasonal event system'
                    },
                    marker: {
                        current: 'The current season is {season} for {time}.',
                        started: 'started {time}',
                        none: 'There is no active season currently.',
                        disabled:
                            'You have seasons disabled, enable to view current event.'
                    },
                    particles: {
                        name: 'Display particles during select seasons',
                        bio: 'During winter seasons you get snowflakes!'
                    },
                    show_less_particles: {
                        name: 'Display a reduced number of particles'
                    },
                    fps_particles: {
                        name: 'Display particles without fancy effects',
                        bio: 'This might be more demanding on some systems'
                    },
                    overlays: {
                        name: 'Display additional seasonal effects',
                        bio: 'During winter seasons this is used for ice effects, otherwise mainly just gradients.'
                    },
                    announce: 'It is now {s}!',
                    nonsense: 'A Nonsense Christmas',
                    fruitcake: 'fruitcake',
                    mistletoe: 'Mistletoe',
                    festival: 'Christmas Eve',
                    exclusive_for_season:
                        'Exclusive for <span class="season-name">{season}</span>',
                    exclusive_for_season_and_more:
                        'Exclusive for <span class="season-name">{season}</span> and 1 more',
                    view: 'Open seasonal tab'
                },
                artwork: {
                    name: 'Okładka'
                },
                hue_from_album: {
                    name: 'Automatically colour album pages',
                    bio: 'Picks the primary colour from an album cover to paint the page.'
                },
                gloss: {
                    name: 'Nakładka błyszcząca',
                    bio: 'Dodaj odblasku do wszystkich okładek.'
                },
                display: {
                    name: 'Wyświetlacz'
                },
                colourful_counts: {
                    name: 'Użyj gradientu kolorów dla wszystkich czasów rankingów',
                    bio: 'Kolor jest przypisywany na podstawie twojej pozycji w wszechczasowych statystykach artystów.'
                },
                colourful_tracks: {
                    name: 'Colour actively scrobbling tracks based on album art',
                    bio: 'Picks the primary colour from the associated cover to paint the track.'
                },
                gendered_tags: {
                    name: 'Ukryj tagi związane z płcią',
                    bio: 'Domyślnie tagi związane z płcią są ukryte w bleh ze względu na ich nieuporządkowaną i problematyczną nature.'
                },
                rain: {
                    name: 'Niech pada!',
                    bio: 'deszcz :3c (może wpływać na wydajność!! może też wyglądać źle!!)'
                },
                show_your_progress: {
                    name: 'Show your weekly progress',
                    bio: 'too many numbers ~w~'
                },
                profile_header: {
                    name: 'Display profile backgrounds',
                    see_type: 'Source from avatar instead of top artist',
                    view_on: 'View backgrounds on',
                    for_own: 'My own profile',
                    for_others: 'Other profiles'
                },
                sat_bg: {
                    name: 'Card background saturation',
                    bio: 'Control the colour of backgrounds in addition to main accent'
                }
            },
            activities: {
                name: 'Activities',
                bio: 'Track your most recent activities locally on your profile.',
                toggle: {
                    name: 'Enable activity tracking',
                    bio: 'Events will only be registered and displayed while enabled.'
                },
                types: {
                    shout: 'Shouts',
                    image: 'Image uploads and interactions',
                    obsess: 'Track obsessions',
                    love: 'Track love',
                    install: 'Installing and updating',
                    wiki: 'Wiki editing'
                }
            },
            performance: {
                name: 'Wydajność',
                bio: 'Napotykasz problemy z ładowaniem motywu? Wypróbuj te ustawienia.',
                dev: {
                    name: 'Wyłącz wbudowane ładowanie motywu',
                    bio: 'Pozwala to na ładowanie wbudowanego motywu za pomocą rozszerzenia Stylus, co może być bardziej wydajne.',
                    modals: {
                        prompt: {
                            alert: 'Po odświeżeniu strony wbudowany motyw bleh zostanie wyłączony (chyba że ponownie wyłączysz tę opcję).',
                            stylus: 'Jeśli nie masz jeszcze rozszerzenia <strong>Stylus</strong>, wybierz swoją przeglądarkę poniżej:',
                            browsers: {
                                chrome: {
                                    name: 'Chrome',
                                    bio: 'dla Chrome, Edge, Brave, Opera'
                                },
                                firefox: {
                                    name: 'Firefox',
                                    bio: 'tylko dla Firefox'
                                }
                            }
                        },
                        continue: {
                            next_step:
                                'Gdy już zainstalujesz rozszerzenie, kliknij "Zainstaluj styl" na nowej karcie, która się otworzy.'
                        },
                        finish: {
                            alert: 'Gotowe! Od teraz motyw będzie obsługiwany za pomocą Stylus.'
                        }
                    }
                },
                bug: {
                    name: 'Something wrong?',
                    bio: 'Report a bug in the bleh repo to get it fixed.'
                }
            },
            profiles: {
                name: 'Profil',
                bio: 'Zarządzaj swoimi danymi i danymi zapisanych na innych profilach.',
                notes: {
                    name: 'Notatki',
                    header: 'Notatka',
                    placeholder:
                        'Wprowadź lokalną notatkę dla tego użytkownika',
                    edit: 'Edytuj notatkę',
                    delete: 'Usuń notatkę',
                    edit_user: 'Edytuj notatkę dla {u}',
                    delete_user: 'Usuń notatkę dla {u}'
                },
                you: 'You'
            },
            redirects: {
                name: 'Redirects',
                bio: "Manage last.fm's (not) handy redirection system as best as possible.",
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: "No, I didn't mean Travi$ Scott"
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: "By default, last.fm will 'auto-correct' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.",
                    action: 'Open Settings'
                }
            },
            corrections: {
                name: 'Corrections',
                bio: "Manage bleh's in-built correction system for artist, album, and track titles.",
                toggle: {
                    name: 'Enable the correction system'
                },
                view: {
                    name: 'View current corrections',
                    bio: 'Lists all active in your install'
                },
                formatting: 'Smart music titles',
                format_guest_features: {
                    name: 'Formatuj występy i tagi utworów',
                    bio: 'Mniej eksponuje występy i tagi utworów (np. Remix, Deluxe Edition, itp.)'
                },
                show_guest_features: {
                    name: 'Display guest features in title and artist',
                    bio: 'Turning off will remove from title and prefer artist field.'
                },
                stacked_chartlist_info: {
                    name: 'Stack track name and title',
                    bio: 'Both matches streaming services and increases max length of each.'
                },
                show_remaster_tags: {
                    name: 'Show remaster tags',
                    bio: "Nobody likes remasters (or the tags), if you'd prefer to still listen but remove the annoyance hide them!"
                },
                submit: {
                    name: 'Submit new correction',
                    bio: 'Have an artist, album, or track name that you feel is capitalised wrong?',
                    action: 'Submit'
                },
                listing: {
                    artists: 'Artists',
                    albums_tracks: 'Albums and tracks'
                }
            },
            language: {
                name: 'Language',
                supported: 'Supported by bleh',
                by: 'by {users}',
                submit: {
                    name: 'Are you fluent in another language?',
                    bio: 'Translations are purely community-contributed.',
                    action: 'Submit translation'
                }
            },
            text: {
                name: 'Text',
                shout_preview_md:
                    'jakikolwiek <strong>losowy</strong> tekst,<br>który <a href="https://cutensilly.org">nic nie znaczy</a>',
                shout_preview: 'jakikolwiek losowy tekst, który nic nie znaczy',
                markdown: {
                    name: 'Use markdown formatting',
                    bio: 'Enables line-breaks, bold, italics, and links.',
                    shouts: 'In shouts',
                    profile: 'In profile bios'
                },
                font: {
                    name: 'Font settings',
                    placeholder: 'Font name(s), separated by commas'
                },
                font_weight: {
                    name: 'Font weight',
                    bio: 'Used for most regular text'
                },
                font_weight_medium: {
                    name: 'Medium font weight',
                    bio: 'Used for bold text'
                },
                font_weight_bold: {
                    name: 'Bold font weight',
                    bio: 'Used for larger text such as headers'
                },
                font_emoji: {
                    name: 'Use compatibility emoji font',
                    bio: 'On Windows systems prior to 11, the emoji font is majorly outdated unless this option is used. (such as 🏳️‍⚧️)'
                }
            },
            inbuilt: {
                profile: {
                    name: 'Profil',
                    subtitle: {
                        name: 'Podtytuł',
                        aka: 'aka.',
                        pronouns: 'zaimki'
                    },
                    pronoun_tip:
                        'Jeśli zaimki są umieszczone jako pierwsze, "aka." zmieni się na "zaimki".',
                    country: 'Kraj',
                    website: 'Strona internetowa',
                    about: 'O mnie',
                    toggle_preview: {
                        name: 'Przełącz podgląd',
                        bio: 'Podgląd, jak twój profil wygląda dla innych',
                        note: 'Uwaga: Nowe linie, linki itp. są widoczne tylko dla innych użytkowników bleh, zwykli użytkownicy Last.fm widzą nowe linie jako spacje.'
                    },
                    banner_tip:
                        'Images can be embedded using ![](link). You can also set a custom profile banner with ![banner](link).',
                    avatar: {
                        name: 'Edytuj awatar',
                        upload: 'Prześlij plik',
                        delete: 'Usuń awatar'
                    }
                },
                charts: {
                    name: 'Rankingi',
                    recent: {
                        count: {
                            name: 'Liczba utworów do wyświetlenia'
                        },
                        artwork: {
                            name: 'Wyświetl okładki albumów'
                        },
                        realtime: {
                            name: 'Aktualizuj utwory w czasie rzeczywistym'
                        }
                    },
                    artists: {
                        timeframe: {
                            name: 'Domyślny przedział czasowy'
                        },
                        style: {
                            name: 'Styl rankingu'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    albums: {
                        timeframe: {
                            name: 'Domyślny przedział czasowy'
                        },
                        style: {
                            name: 'Styl rankingu'
                        },
                        length: {
                            name: 'Chart size'
                        }
                    },
                    tracks: {
                        count: {
                            name: 'Liczba utworów do wyświetlenia'
                        },
                        timeframe: {
                            name: 'Domyślny przedział czasowy'
                        }
                    }
                },
                ignore: {
                    name: 'Communication',
                    consider: {
                        name: 'To consider',
                        good: [
                            'You will not see previous or new shouts globally',
                            'They cannot direct message you',
                            'They cannot leave a shout on your profile or under your shouts anywhere'
                        ],
                        bad: [
                            'You cannot delete pre-existing shouts from your profile',
                            'They can still view your profile'
                        ]
                    },
                    view: 'View {c} more',
                    count: 'You have {c} users hidden'
                },
                privacy: {
                    name: 'Prywatność',
                    recent_listening: {
                        name: 'Ukryj historię ostatnich odsłuchów',
                        bio: 'Zachowaj tajemnicę swoich ostatnich odsłuchów o.O'
                    },
                    receiving_msgs: {
                        name: 'Kontroluj kto może się z Tobą zkontaktować',
                        bio: 'To ustawienie kontroluje kto może wysyłać wiadomosci i prywatne wiadomości do ciebie.',
                        settings: {
                            everyone: {
                                name: 'Każdy',
                                bio: 'Każdy oprócz osób które zostały przez ciebie zignorowane'
                            },
                            neighbours: {
                                name: 'Osoby których obserwujesz i sąsiadujący',
                                bio: 'Wszyscy których obserwujesz oraz Twoi sąsiedzi na Last.fm'
                            },
                            follow: {
                                name: 'Tylko osoby które obserwujesz',
                                bio: 'Tylko użytkownicy których obserwujesz'
                            }
                        }
                    },
                    disable_shoutbox: {
                        name: 'Ukryj swój shoutbox',
                        bio: 'Twój shoutbox zostanie ukryty dla ciebie i dla innych użytkowników.'
                    }
                }
            },
            actions: {
                import: {
                    name: 'Importuj',
                    modals: {
                        initial: {
                            name: 'Importuj ustawienia z poprzedniej instalacji',
                            alert: 'Wszystko co zaimportujesz zastąpi twoje bieżące ustawienia. Importując ustawienia z internetu upewnij się że źródło jest zaufane.'
                        },
                        failed: {
                            name: 'Import nie powiódł się',
                            alert: 'Nie udało się przetworzyć importowanych ustawień. Żadne zmiany nie zostały wprowadzone.'
                        }
                    }
                },
                export: {
                    name: 'Eksportuj',
                    modals: {
                        initial: {
                            name: 'Eksportuj swoje bieżące ustawienia',
                            alert: 'Twoje bieżące ustawienia są w polu tekstowym poniżej, gotowe do skopiowania.'
                        }
                    }
                },
                reset: {
                    name: 'Resetuj',
                    modals: {
                        initial: {
                            name: 'Resetuj ustawienia do domyślnych',
                            alert: 'Twoje ustawienia zostaną <strong>zresetowane do domyślnych</strong> bez możliwości cofnięcia. Czy na pewno chcesz kontynuować?',
                            confirm: 'Tak, resetuj moje ustawienia',
                            export: 'Eksportuj najpierw'
                        }
                    }
                }
            }
        },
        gallery: {
            tabs: {
                overview: 'Zdjęcia',
                bookmarks: 'Zapisane'
            },
            bookmarks: {
                name: 'Zapisane',
                bio: 'Zdjęcia galerii można zapisać na przyszłość.',
                no_data: 'brak zapisanych zdjęć (・・ )',
                link: 'View all saved photos',
                button: {
                    image_is_bookmarked: {
                        name: 'Masz to zdjęcie zapisane'
                    },
                    bookmark_this_image: {
                        name: 'Zapisz to zdjęcie',
                        bio: 'Zapisz to zdjęcie na później'
                    },
                    unbookmark_this_image: {
                        name: 'Usuń zapis tego zdjęcia',
                        bio: 'Usuń zapis tego zdjęcia'
                    }
                }
            },
            empty: {
                title: 'No title',
                description: 'No description'
            },
            prefer: {
                name: 'Star'
            },
            report: {
                name: 'Report'
            },
            open: {
                name: 'Expand',
                tooltip: 'Expand image to full resolution'
            },
            up: 'Up votes:',
            down: 'Down votes:',
            vote: 'This is the sum of votes used for ordering.'
        },
        activities: {
            name: 'Recent Activity',

            test: 'TEST {involved}',
            shout: 'You left a shout for {i}',
            image_upload: 'You uploaded an image for {i}',
            image_star: 'You starred an image for {i}',
            obsess: 'You’re obsessed with {i}',
            unobsess: 'You’re no longer obsessed with {i}',
            love: 'You love {i}',
            unlove: 'You no longer love {i}',
            install_bwaa: 'You installed bwaa',
            update_bwaa: 'You updated bwaa to {i}',
            install_bleh: 'You installed bleh',
            update_bleh: 'You updated bleh to {i}',
            bookmark: 'You bookmarked {i}',
            unbookmark: 'You removed {i}’s bookmark',
            wiki: 'You edited on {i}'
        },
        artist: {
            name: 'Artist',
            plural: 'Artists',
            tooltip: 'Multiple artists are combined into this profile.'
        },
        album: {
            name: 'Album',
            plural: 'Albums'
        },
        track: {
            name: 'Track',
            plural: 'Tracks'
        },
        tag: {
            name: 'Tag'
        },
        search: {
            name: 'Search',
            results_for: 'Results for {v}'
        },
        inbox: {
            name: 'Inbox',
            overview: 'Messages',
            sent_overview: 'Messages',
            compose: 'Messages',
            message_overview: 'Messages',
            sent_message: 'Messages',
            notifications: 'Notifications'
        },
        charts: {
            name: 'Charts',
            overview: 'Real time',
            weekly: 'Weekly',
            charts_for: 'Charts for {date}',
            view: 'View the charts',
            scroll: {
                name: 'Simulate horizontal scrolling',
                bio: 'Disable if you can scroll easily on a laptop for example.'
            }
        },
        bookmarks: {
            name: 'Bookmarks'
        },
        home: {
            name: 'Home',
            welcome: 'Welcome back {m}'
        }
    }
};
moment.updateLocale('de', {
    relativeTime: {
        future: 'in %s',
        past: 'vor %s',
        s: 'ein paar Sekunden',
        ss: '%d Sekunden',
        m: 'eine Minute',
        mm: '%d Minuten',
        h: 'eine Stunde',
        hh: '%d Stunden',
        d: 'ein Tag',
        dd: '%d Tagen',
        w: 'eine Woche',
        ww: '%d Wochen',
        M: 'ein Monat',
        MM: '%d Monate',
        y: 'ein Jahr',
        yy: '%d Jahre'
    }
});
moment.updateLocale('pt', {
    relativeTime: {
        future: 'em %s',
        past: 'há %s',
        s: 'alguns segundos',
        ss: '%d segundos',
        m: 'um minuto',
        mm: '%d minutos',
        h: 'uma hora',
        hh: '%d horas',
        d: 'um dia',
        dd: '%d dias',
        w: 'uma semana',
        ww: '%d semanas',
        M: 'um mês',
        MM: '%d meses',
        y: 'um ano',
        yy: '%d anos'
    }
});

export function tl(key, replacements = {}) {
    if (!key) {
        log('your key is undefined', 'trans');
        return 'NO_TRANSLATION_FOUND';
    }

    let translation = key[lang] || key.en;

    for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        translation = translation.replace(regex, value);
    }

    return translation;
}

function get_lang() {
    const path = window.location.pathname;
    const segments = path.split('/');
    const lang = segments[1];

    if (/^[a-z]{2}$/.test(lang)) {
        return `/${lang}/`;
    }

    return '/';
}

export function lookup_lang() {
    const logo = document.querySelector('.masthead-logo a');

    if (!logo) {
        handle_error_500();
        return;
    }

    setRoot(get_lang());

    let previous_avi = auth.avatar;
    if (auth_link.state) {
        auth.avatar = auth_link.state.querySelector('img').getAttribute('src');

        if (auth.avatar != previous_avi) {
            let avatar = auth_link.state.querySelector('img');
            avatar.setAttribute('crossorigin', 'anonymous');

            try {
                avatar.addEventListener('load', () => {
                    let thief = new ColorThief();
                    let colour = thief.getColor(avatar);

                    let hsl = rgb_to_hsl(colour[0], colour[1], colour[2]);

                    auth.sets.hue = hsl.h;
                    auth.sets.sat = clamp_sat((hsl.s / 100) * 3);
                    auth.sets.lit = clamp_lit(
                        auth.sets.sat,
                        hsl.l / 100 + 0.35
                    );
                });
            } catch (e) {}
        }
    }
    lang = document.documentElement.getAttribute('lang');

    Settings.defaultLocale = lang;

    moment.locale(lang);
}
