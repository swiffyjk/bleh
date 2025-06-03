import { handle_error_500 } from "../page";
import { log } from "./log";
import { auth, auth_link, setRoot } from "./page";
import { clamp_sat, rgb_to_hsl } from "./tools";

// loads your selected language in last.fm
export let lang;
// hello my name is stel :3
export let lang_info = {
    en: {
        name: 'English',
        by: ['katesia'],
        last_updated: 'latest'
    },
    de: {
        name: 'Deutsch',
        by: ['stellasaur', 'katesia'],
        last_updated:  '2025-05-11'
    },
    pl: {
        name: 'Polski',
        by: ['iwas15with100k'],
        last_updated:  '2024-06-17'
    },
    pt: {
        name: 'Português',
        by: ['ArthRMH'],
        last_updated:  '2025-06-03'
    }
}

export const trans = {
    page_templates: {
        type: {
            en: '{page} on {brand} {build}.{sku}',
            de: '{page} auf {brand} {build}.{sku}',
            pt: '{page} no {brand} {build}.{sku}'
        },
        name_type: {
            en: '{name} - {page} on {brand} {build}.{sku}',
            de: '{name} - {page} auf {brand} {build}.{sku}',
            pt: '{name} - {page} no {brand} {build}.{sku}'
        },
        name_sister_type: {
            en: '{name} by {sister} - {page} on {brand} {build}.{sku}',
            de: '{name} von {sister} - {page} auf {brand} {build}.{sku}',
            pt: '{name} por {sister} - {page} no {brand} {build}.{sku}'
        }
    },
    badges: {
        missing: {
            name: {
                en: 'No badges',
                de: 'Kein Abzeichen',
                pt: 'Sem emblemas'
            },
            reason: {
                en: 'Become a sponsor to get a badge!',
                de: 'Werde Sponsor und erhalte ein Abzeichen',
                pt: 'Se torne um apoiador para ganhar um emblema!'
            }
        },
        'user-status-subscriber': {
            name: {
                en: 'Last.fm Pro'
            },
            reason: {
                en: 'Active Pro subscription',
                de: 'Aktives Pro-Abonnement',
                pt: 'Plano Pro ativo'
            }
        },
        'user-status-staff': {
            name: {
                en: 'Staff',
                de: 'Angestellter',
                pt: 'Administrador'
            },
            reason: {
                en: 'Official member of Last.fm',
                de: 'Ofizielles Mitglied von Last FM',
                pt: 'Membro oficial do Last.fm'
            }
        },
        'user-status-mod': {
            name: {
                en: 'Mod'
                pt: 'Moderador'
            },
            reason: {
                en: 'Official member of Last.fm',
                de: 'Ofizielles Mitglied von Last FM',
                pt: 'Membro oficial do Last.fm'
            }
        },
        'user-status-alum': {
            name: {
                en: 'Alum'
            },
            reason: {
                en: 'Since the beginning',
                de: 'Von Anfang an',
                pt: 'Desde o início'
            }
        },
        'label--fade': {
            reason: {
                en: 'They follow you!',
                de: 'Sie folgen dir!',
                pt: 'Ele(a) te segue!'
            }
        },
        contributor: {
            name: {
                en: 'Contributor',
                de: 'Mitwirkender',
                pt: 'Contribuinte'
            },
            reason: {
                en: 'Has worked on bleh or bwaa',
                de: 'Hat an bleh oder bwaa gearbeitet',
                pt: 'Trabalhou no bleh ou bwaa'
            }
        },
        translation: {
            reason: {
                en: 'Translations',
                de: 'Übersetzungen',
                pt: 'Traduções'
            }
        },
        cat: {
            name: {
                en: 'it\s a kitty!!',
                de: 'ein Kätzchen!!!',
                pt: 'é um gatinho!!'
            }
        },
        sponsor: {
            name: {
                en: 'Sponsor',
                pt: 'Apoiador'
            },
            reason: {
                en: 'thank you from kate <3',
                de: 'danke von kate <3',
                pt: 'obrigadão da kate <3'
            }
        },
        cute: {
            reason: {
                en: 'Reserved',
                de: 'Exklusiv',
                pt: 'Reservado'
            }
        },
        reserved: {
            reason: {
                en: 'Reserved',
                de: 'Exklusiv',
                pt: 'Reservado'
            }
        }
    },
    home: {
        en: 'Home',
        de: 'Startseite',
        pt: 'Início'
    },
    library: {
        en: 'Library',
        de: 'Bibliothek',
        ja: 'ライブラリ',
        pt: 'Biblioteca'
    },
    playlists: {
        en: 'Playlists'
    },
    view_profile: {
        en: 'View profile',
        de: 'Profil anzeigen',
        pt: 'Ver perfil'
    },
    shouts: {
        en: 'Shouts',
        pt: 'Caixa de mensagens'
    },
    about: {
        en: 'About',
        de: 'Über',
        pt: 'Sobre'
    },
    edit_wiki: {
        en: 'Edit wiki',
        de: 'Wiki editieren',
        pt: 'Editar wiki'
    },
    read_more: {
        en: 'Read more',
        de: 'Mehr anzeigen',
        pt: 'Ler mais'
    },
    refresh: {
        en: 'Refresh',
        de: 'Aktualisieren',
        pt: 'Atualizar'
    },
    refresh_tracks: {
        en: 'Refresh tracks',
        de: 'Titel aktualisieren',
        pt 'Atualizar faixas'
    },
    set_obsession: {
        en: 'Obsess',
        de: 'Obsessen',
        pt: 'Obsessão'
    },
    obsession_first: {
        en: 'First to claim this obsession!',
        de: 'Die erste Person, die sich diese Obsession für sich beansprucht!',
        pt: 'Primeiro a ter esta obsessão!'
    },
    compare: {
        en: 'Compare',
        de: 'Vergleichen',
        pt: 'Comparar'
    },
    compare_plays: {
        en: 'Compare plays',
        de: 'Plays vergleichen',
        pt: 'Comparar reproduções'
    },
    one_page: {
        en: '1 page',
        pt: '1 página'
    },
    count_pages: {
        en: '{c} pages',
        pt: '{c} páginas'
    },
    gathering_plays_for_user_pages: {
        en: 'Gathering plays for {u} ({current_page}/{pages})',
        pt: 'Reunindo reproduções para {u} ({current_page}/{pages})'
    },
    nothing_in_common: {
        en: 'Nothing in common (๑-﹏-๑)',
        pt: ''Nada em comum (๑-﹏-๑)'
    },
    others_featured: {
        en: 'Others featured',
        de: 'Andere gefeatured',
        pt: 'Outros em destaque'
    },
    your_scrobbles: {
        en: 'Your scrobbles',
        de: 'Deine Scrobbels',
        pt: 'Seus scrobbles'
    },
    plays: {
        en: 'Plays',
        pt: 'Reproduções'
    },
    try_again: {
        en: 'Try again',
        de: 'Erneut versuchen',
        pt: 'Tente novamente'
    },
    back: {
        en: 'Back',
        de: 'Zurück',
        pt: 'Voltar'
    },
    settings: {
        en: 'Settings',
        de: 'Einstellungen',
        pt: 'Configurações'
    },
    on_ignore_list: {
        en: 'Ignored',
        de: 'Ignoriert',
        pt: 'Ignorados'
    },
    friends: {
        en: 'Friends',
        de: 'Freunde',
        pt: 'Amigos'
    },
    aka: {
        en: 'aka.',
        pt: 'vulgo'
    },
    account_pronouns: {
        en: 'pronouns',
        de: 'pronomen',
        pt: 'pronomes'
    },
    account_created: {
        en: 'created',
        de: 'erstellt',
        pt: 'criada'
    },
    account_scrobbling_since_replace: {
        // copy this from last.fm 1:1 (including the space at the end if there)
        en: '• scrobbling since ',
        de: '• scrobbelt seit ',
        pt: '• scrobblando desde '
    },
    edit: {
        en: 'Edit',
        de: 'Editieren',
        pt: 'Editar'
    },
    bulk_edit: {
        // as in the last.fm 'Bulk Edit' open-source extension
        en: 'Bulk edit',
        de: 'Massenbearbeitung',
        pt: 'Edição em massa'
    },
    edit_profile: {
        en: 'Edit profile',
        de: 'Profil editieren',
        pt: 'Editar perfil'
    },
    scrobbles: {
        en: 'Scrobbles',
        de: 'Scrobbels',
        pt: 'Scrobbles'
    },
    count_scrobbles: {
        en: '{c} scrobbles',
        de: '{c} scrobbels',
        pt: '{c} scrobbles'
    },
    // TODO(stel): are all these correct (singular/plural)?
    artist: {
        en: 'Artist',
        de: 'Künstler',
        pt: 'Artista'
    },
    artists: {
        en: 'Artists',
        de: 'Künstler',
        pt: 'Artistas'
    },
    artists_tooltip: {
        en: 'Multiple artists are grouped into this profile',
        de: 'Mehrere Künstler sind in diesem Profil sortiert',
        pt: 'Múltiplos artistas estão agrupados neste perfil'
    },
    album: {
        en: 'Album',
        de: 'Album',
        pt: 'Álbum'
    },
    albums: {
        en: 'Albums',
        de: 'Alben',
        pt: 'Álbuns'
    },
    track: {
        en: 'Track',
        de: 'Titel',
        pt: 'Faixa'
    },
    tracks: {
        en: 'Tracks',
        de: 'Titel',
        pt: 'Faixas'
    },
    appearance: {
        en: 'Appearance',
        de: 'Aussehen',
        pt: 'Aparência'
    },
    themes: {
        name: {
            en: 'Themes',
            de: 'Farbschema',
            pt: 'Temas'
        },
        light: {
            en: 'Light',
            de: 'Hell',
            pt: 'Claro'
        },
        ink: {
            en: 'Ink',
            de: 'Tinte',
            pt: 'Tinta'
        },
        dark: {
            en: 'Ash',
            de: 'Asche',
            pt: 'Cinzas'
        },
        darker: {
            en: 'Dark',
            de: 'Dunkel',
            pt: 'Escuro'
        },
        oled: {
            en: 'Void',
            de: 'Leere',
            pt: 'Escuridão'
        }
    },
    colours: {
        en: 'Colours',
        de: 'Farben',
        pt: 'Colorir'
    },
    hue_from_album: {
        name: {
            en: 'Colour album pages based on album art',
            pt: 'Colore páginas de álbuns com base na capa'
        },
        body: {
            en: 'Highlights the primary colour from the album art to replace your colour temporarily',
            pt: 'Destaca a cor primária da capa do álbum para substituir sua cor temporariamente'
        }
    },
    colourful_tracks: {
        name: {
            en: 'Colour active track based on album art',
            de: 'Farbe des aktiven Titels basierend auf dem Albumcover',
            pt: 'Colore a faixa atual baseada na capa do álbum'
        },
        body: {
            en: 'Highlights the primary colour from the album art for the individual track',
            de: 'Hebt die Farbe des Albumcovers für den einzelnen Titel hervor',
            pt: 'Realça a cor primária da capa de álbum para a faixa individual'
        }
    },
    configure: {
        en: 'Configure',
        de: 'Konfigurieren',
        pt: 'Configurar'
    },
    //sounds kinda weird so i changed back to english as the final version for event ; german festival sites use 'line-up' aswell so ill stick to that ~stel
    event: {
        en: 'Event',
        pt: 'Evento'
    },
    events: {
        en: 'Events',
        pt: 'Eventos'
    },
    lineup: {
        en: 'Line-up',
        pt: 'Programação'
    },
    attendance: {
        en: 'Attendance',
        de: 'Teilnahme',
        pt: 'Comparecimento'
    },
    top_badge: {
        en: 'Top Badge',
        de: 'Top-Abzeichen',
        pt: 'Emblema superior'
    },
    //souns betta englush
    layout: {
        en: 'Layout',
        pt: 'Disposição'
    },
    music: {
        en: 'Music',
        de: 'Musik',
        pt: 'Música'
    },
    profile: {
        en: 'Profile',
        de: 'Profil',
        pt: 'Perfil'
    },
    seasonal: {
        name: {
            // translate to 'Seasons' if it reads better
            en: 'Seasonal',
            de: 'Saisonal',
            pt: 'Estações'
        },
        listing: {
            none: {
                en: 'None active',
                de: 'Keine Aktiv',
                pt: 'Nenhuma ativa'
            },
            easter: {
                en: 'Easter',
                de: 'Ostern',
                pt: 'Páscoa'
            },
            pride: {
                en: 'Pride',
                pt: 'Orgulho'
            },
            halloween: {
                en: 'Halloween',
                pt: 'Dia das Bruxas'
            },
            pre_fall: {
                en: 'Early autumn',
                pt: 'Pré-outono'
            },
            fall: {
                en: 'Autumn',
                de: 'Herbst',
                pt: 'Outono'
            },
            christmas: {
                en: 'Christmas',
                de: 'Weihnachten',
                pt: 'Natal'
            },
            new_years: {
                en: 'New Years',
                de: 'Silvester',
                pt: 'Ano Novo'
            }
        }
    },
    seasonal_timeline: {
        en: 'Seasonal timeline',
        de: 'Saisonale Zeitleiste',
        pt: 'Linha do tempo sazonal'

    },
    //i removed the 'current' cus it soyunds better without lol, add back if u disagree or sum :3 and add 'aktuellen' infront of Zeitzone in german
    seasonal_offset: {
        en: 'Seasonal events are ran in your timezone, which we calculated as {offset}',
        de: 'Saisonale Events werden in deiner Zeitzone ausgeführt, die wir als {offset} berechnet haben',
        pt: 'Eventos sazonais são realizados no seu fuso horário, que calculamos como {offset}'
    },
    started: {
        en: 'Started',
        de: 'Gestartet',
        pt: 'Começou'
    },
    next_in: {
        en: 'Next in',
        pt: 'Próximo em'
    },
    ends_in: {
        en: 'Ends in',
        de: 'Endet in',
        pt: 'Termina em'
    },
    text: {
        en: 'Text',
        pt: 'Texto'
    },
    accessibility: {
        en: 'Accessibility',
        de: 'Barrierefreiheit',
        pt: 'Acessibilidade'
    },
    troubleshooting: {
        en: 'Advanced',
        de: 'Fortgeschritten',
        pt: 'Avançado'
    },
    recommendations: {
        en: 'Recommendations',
        de: 'Empfelungen',
        pt: 'Recomendações'
    },
    releases: {
        en: 'Releases',
        de: 'Veröffentlichungen',
        pt: 'Lança'
    },
    bookmarks: {
        en: 'Bookmarks',
        de: 'Lesezeichen',
        pt: 'Marcadores'
    },
    charts: {
        en: 'Charts',
        pt: 'Paradas'
    },
    welcome_back_user: {
        en: 'Welcome back {user}!',
        de: 'Willkommen züruck {user}!',
        pt: 'Bem-vindo(a) {user}!'
    },
    // TODO(stel): is my capitalisation correct here at all lol ; yes cutie, well done <3
    good_morning_user: {
        en: 'Good morning, {user}',
        de: 'Guten Morgen, {user}',
        pt: 'Bom dia, {user}'
    },
    good_afternoon_user: {
        en: 'Good afternoon, {user}',
        de: 'Guten Nachmittag, {user}',
        pt: 'Boa tarde, {user}'
    },
    good_evening_user: {
        en: 'Good evening, {user}',
        de: 'Guten Abend, {user}',
        pt: 'Boa tardezinha, {user}'
    },
    good_night_user: {
        en: 'Goodnight, {user}',
        de: 'Gute Nacht, {user}',
        pt: 'Boa noite, {user}'
    },
    bleh_settings: {
        en: 'bleh Settings',
        de: 'bleh Einstellungen',
        pt: 'Configurações do bleh'
    },
    bleh_setup: {
        en: 'Setup',
        de: 'Einrichtung',
        pt: 'Instalação'
    },
    import: {
        en: 'Import',
        de: 'Importieren',
        pt: 'Importar'
    },
    import_settings: {
        en: 'Import settings',
        pt: 'Importar configurações'
    },
    import_notice: {
        en: 'This is a permanent action, beware of where you are copying from',
        pt: 'Esta é uma ação permanente, cuidado com o lugar de onde você está copiando'
    },
    export: {
        en: 'Export',
        de: 'Exportieren',
        pt: 'Exportar'
    },
    export_settings: {
        en: 'Export settings',
        pt: 'Exportar configurações'
    },
    reset: {
        en: 'Reset',
        de: 'Zurücksetzen',
        pt: 'Restaurar'
    },
    reset_settings: {
        en: 'Reset settings to default',
        pt: 'Restaurar as configurações para o padrão'
    },
    reset_notice: {
        en: 'Your settings will be permanently reset, are you sure?',
        pt: 'Sua configuração vai ser permanentemente restaurada ao padrão, você tem certeza?'
    },
    make_a_backup: {
        en: 'Make a backup',
        pt: 'Faça um backup'
    },
    news: {
        en: 'News',
        de: 'Neuigkeiten',
        pt: 'Notícias'
    },
    news_from_user: {
        en: 'News from {user}',
        de: 'Neuigkeiten von {user}',
        pt: 'Notícias do {user}'
    },
    default: {
        en: 'Default',
        de: 'Standard',
        pt: 'Padrão'
    },
    avatar: {
        en: 'Avatar'
    },
    customise: {
        en: 'Customise',
        de: 'Anpassen',
        pt: 'Customizar'
    },
    convert: {
        en: 'Convert',
        de: 'Umwandeln',
        pt: 'Converter'
    },
    convert_from_hex: {
        en: 'Convert colour',
        de: 'Farbe umwandeln',
        pt: 'Converter cor'
    },
    fonts: {
        en: 'Fonts',
        de: 'Schriftart',
        pt: 'Fontes'
    },
    hue: {
        en: 'Accent colour',
        de: 'Akzentfarbe',
        pt: 'Cor de destaque'
    },
    sat: {
        en: 'Vibrancy',
        de: 'Lebendigkeit',
        pt: 'Vivacidade'
    },
    lit: {
        en: 'Lightness',
        de: 'Helligkeit',
        pt: 'Claridade'
    },
    seasonal_warning: {
        en: 'This season has a custom default accent colour!',
        de: 'Diese Saison hat eine benutzerdefinierte Akzentfarbe',
        pt: 'Esta estação tem uma cor de destaque personalizada!'
    },
    card_background_saturation: {
        name: {
            en: 'Card background vibrancy',
            de: 'Lebendigkeit des Kartenhintergrunds',
            pt: 'Vivacidade de fundo do cartão'
        },
        body: {
            en: 'Bring some colour into your world (or reduce it)',
            de: 'Bringe etwas Farbe in deiner Welt (oder reduziere sie)',
            pt: 'Traz algumas cores ao mundo (ou diminui elas)'
        }
    },
    save: {
        en: 'Save',
        de: 'Speichern',
        pt: 'Salvar'
    },
    add: {
        en: 'Add',
        de: 'Hinzufügen',
        pt: 'Adicionar'
    },
    remove: {
        en: 'Remove',
        de: 'Entfernen',
        pt: 'Remover'
    },
    clear: {
        en: 'Clear',
        de: 'Löschen',
        pt: 'Limpar'
    },
    close: {
        en: 'Close',
        de: 'Schließen',
        pt: 'Fechar'
    },
    go: {
        en: 'Go',
        de: 'Los',
        pt: 'Ir'
    },
    skip: {
        en: 'Skip',
        de: 'Überspringen',
        pt: 'Pular'
    },
    send: {
        en: 'Send',
        de: 'Senden',
        pt: 'Enviar'
    },
    send_quickly_with: {
        en: 'Send quickly with {kbd}',
        de: 'Schnell senden mit {kbd}',
        pt: 'Enviar rapidamente com {kbd}'
    },
    done: {
        en: 'Done',
        de: 'Fertig',
        pt: 'Feito'
    },
    finish: {
        en: 'Finish',
        de: 'Beenden',
        pt: 'Terminar'
    },
    continue: {
        en: 'Continue',
        de: 'Fortsetzen',
        pt: 'Contiuar'
    },
    right_click_for_more_options: {
        en: 'Right click for more options',
        de: 'Rechtsklick für weitere optionen',
        pt: 'Clique esquerdo para mais opções'
    },
    refresh_pending: {
        name: {
            en: 'Refresh pending',
            de: 'Aktualisierung anstehend',
            pt: 'Atualizar pendências'
        },
        body: {
            en: 'A setting you changed requires a page refresh to take effect.',
            de: 'Eine von dir geänderte Einstellung erfordert eine Seitenaktualisierung, damit sie wirksam wird',
            pt: 'Uma configuração que você mudou exige uma atualização de página para fazer efeito'
        }
    },
    new: {
        en: 'New',
        de: 'Neu',
        pt: 'Novo'
    },
    beta: {
        en: 'Beta'
    },
    more: {
        en: 'More',
        de: 'Weiter',
        pt: 'Mais'
    },
    notifications: {
        name: {
            en: 'Notifications',
            de: 'Benachrichtigungen',
            pt: 'Notificações'
        },
        count: {
            en: '{count} notifications',
            de: '{count} Benachrichtigungen',
            pt: '{count} notificações'
        },
        none: {
            en: 'No new notifications',
            de: 'Keine neuen Benachrichtigungen',
            pt: 'Nenhuma notificação nova'
        }
    },
    inbox: {
        name: {
            en: 'Messages',
            de: 'Nachrichten',
            pt: 'Mensagens'
        },
        count: {
            en: '{count} messages',
            de: '{count} Nachrichten',
            pt: '{count} mensagens'
        },
        none: {
            en: 'No new messages',
            de: 'Keine neuen Nachrichten',
            pt: 'Nenhuma mensagem nova'
        }
    },
    about_me_preview: {
        en: 'About Me (preview)',
        de: 'Über mich (Vorschau)',
        pt: 'Sobre mim (preview)'
    },
    markdown_tip: {
        // use <br><br> to add a space between the first sentence and the next
        // keep the alt text as "banner", english and lowercase as thats how its detected rn
        // may change in the future
        en: 'You can use line breaks, bold text, italics, underlines, images, and headers visible to other bleh users.<br><br>Images are created via ![alt text](link). Changing the alt text to "banner" applies a profile banner.',
        de: 'Du kannst Zeilenumbrüche, Fettdruck, Kursivschrift, Unterstreichungen, Bilder und Überschriften verwenden, die für andere bleh-Nutzer sichtbar sind.<br><br>Bilder werden über ![Alt-Text](Link) erstellt. Wenn du den Alt-Text in „banner“ änderst, wird ein Profilbanner angewendet.',
        pt: 'Você pode usar quebras de linha, texto em negrito, itálico, sublinhado, imagens e cabeçalhos visíveis para outros usuários do bleh.<br><br>As imagens são criadas usando ![alt text](link). Alterar o alt text para "banner" aplica um banner no perfil.'
    },
    find_on: {
        en: 'Find on',
        de: 'Finde auf',
        pt: 'Encontrar em'
    },
    following: {
        en: 'Following',
        de: 'Gefolgt',
        pt: 'Seguindo'
    },
    followers: {
        en: 'Followers',
        de: 'Follower*innen',
        pt: 'Seguidores'
    },
    neighbours: {
        en: 'Neighbours',
        de: 'Nachbarn',
        pt: 'Vizinhos'
    },
    website: {
        en: 'Website',
        de: 'Webseite'
    },
    overview: {
        en: 'Overview',
        de: 'Übersicht',
        pt: 'Visão Geral'

    },
    photos: {
        en: 'Photos',
        de: 'Fotos',
        pt: 'Fotos'
    },
    artwork: {
        en: 'Artwork',
        de: 'Cover',
        pt: 'Arte de Capa'
    },
    similar_artists: {
        en: 'Similar Artists',
        de: 'Ähnliche Künstler*innen',
        pt: 'Artistas Similares'
    },
    biography: {
        en: 'Biography',
        de: 'Biographie',
        pt: 'Biografia'
    },
    wiki: {
        en: 'Wiki'
    },
    listeners: {
        en: 'Listeners',
        de: 'Zuhörer*innen',
        pt: 'Ouvintes'
    },
    count_listeners: {
        en: '{c} listeners',
        pt: '{c} ouvintes'
    },
    // tag sounds better in english
    tag: {
        en: 'Tag'
    },
    tags: {
        en: 'Tags'
    },
    reports: {
        // last.fm listening reports
        en: 'Reports',
        de: 'Berichte',
        ja: 'レポート',
        pt: 'Relatório'
    },
    artist_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'artist',
        de: 'Künstler',
        pt: 'Artista'
    },
    album_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'album',
        de: 'Album',
        pt: 'Álbum'
    },
    track_lower: {
        // used inside a sentence not on its own,
        // make lowercase if thats how the language works
        en: 'track',
        de: 'Titel',
        pt: 'Faixa'
    },
    lotus_cta: {
        // {t} is replaced by one of the 3 above
        // capitalisation here refers to the lotus system, which corrects
        // titles that are capitalised wrongly eg. 'eSpReSsO' -> 'Espresso'
        true: {
            en: 'This {t} is being re-capitalised, is it correct?',
            de: '{t} wird neu großgeschrieben, ist das richtig?',
            pt: '{t} teve a capitalização ajustada, está correto?'
        },
        false: {
            en: 'Is this {t} capitalised correctly?',
            de: 'Ist {t} richtig großgeschrieben?',
            pt: 'Esse(a) {t} está capitalizado corretamente?'
        }
    },
    suggest_correction: {
        // suggest a correction for the above system
        en: 'Suggest a correction',
        de: 'eine Korrektur vorschlagen',
        pt: 'Sugira uma correção'
    },
    recent_tracks: {
        en: 'Recent Tracks',
        de: 'Kürzlich gespielte Titel',
        pt: 'Faixas Recentes'
    },
    top_artists: {
        en: 'Top Artists',
        de: 'Top Künstler',
        pt: 'Top Artistas'
    },
    top_albums: {
        en: 'Top Albums',
        de: 'Top Alben',
        pt: 'Top Álbuns'
    },
    top_tracks: {
        en: 'Top Tracks',
        de: 'Top Titel',
        pt: 'Top Faixas'
    },
    you_share_count_with: {
        // as in your musical taste between you and someone else
        // you share {percentage%} (in taste) with: {list of artists}
        en: 'You share {c} with',
        de: 'Du teilst {c} mit',
        pt: 'Você compartilha {c} com'
        one: {
            en: '{artist}'
        },
        two: {
            en: '{artist1}, {artist2}'
        },
        three: {
            en: '{artist1}, {artist2}, {artist3}'
        }
    },
    taste_similarity: {
        en: 'Taste similarity',
        pt: 'Similaridade de gostos'
    },
    plays_lower: {
        // 20 plays in artist/album grid
        // copy from last.fm
        en: ' plays',
        pt: ' reproduções'
    },
    message: {
        // as in a direct message
        en: 'Message',
        de: 'Anschreiben',
        pt: 'Mensagem'
    },
    sponsor_data: {
        en: 'Sponsor and badge data version {v}',
        de: 'Sponsoren- und Abzeichen Version {v}',
        pt: 'Versão de data de apoiador e emblemas'
    },
    sponsor: {
        en: 'Become a sponsor',
        de: 'Werde Sponsor',
        pt: 'Torne-se um apoiador'
    },
    message_sponsor: {
        // rewards meaning a badge for example
        en: 'Receive sponsor rewards',
        de: 'Sponsorenprämien erhalten',
        pt: 'Receba recompensas de apoiador'
    },
    news_sponsor_cta: {
        en: 'Want to support future development of bleh?',
        de: 'Möchten du die zukünftige Entwicklung von bleh unterstützen?',
        pt: 'Quer apoiar o futuro desenvolvimento do bleh?'
    },
    support_future_development: {
        // in the context of sponsoring
        en: 'Support future development',
        de: 'Unterstütze die zukünftige Entwicklung',
        pt: 'Apoie o futuro desenvolvimento'
    },
    why_sponsor: {
        en: 'Receive an accompanying badge on your profile and a big thank you from katelyn for supporting <3',
        de: 'Erhalte ein Abzeichen auf deinem Profil und ein großes Dankeschön von katelyn für deine Unterstützung <3',
        pt: 'Receba um emblema no seu perfil e um obrigadão da kate por apoiar <3'
    },
    you_are_a_sponsor: {
        en: 'You are a sponsor, thank you! :3',
        de: 'Du bist ein Sponsor, dankeschön! :3',
        pt: 'Você é um apoiador, muito obrigado! :3'
    },
    sponsor_get_badge: {
        en: 'A monthly sponsorship grants you a custom badge of your choosing.',
        de: 'Mit einem monatlichen Sponsoring erhältst du ein individuelles Abzeichen deiner Wahl',
        pt: 'Um apoio mensal lhe dá um emblema personalizado de sua escolha.'
    },
    sponsor_no_badge: {
        en: 'A custom badge is only available with a monthly sponsorship.',
        de: 'Ein individuelles Abzeichen ist nur mit einem montalichen Sponsoring erhältlich',
        pt: 'Um emblema personalizado só está disponível com um apoio mensal'
    },
    manage_sponsor: {
        en: 'Manage sponsorship',
        de: 'Sponsoring verwalten',
        pt: 'Gerenciar apoio'
    },
    labs: {
        en: 'Labs'
    },
    labs_by_last: {
        en: 'Labs by Last.fm',
        de: 'Labs von Last.fm',
        pt: 'Labs do Last.fm'
        tagline: {
            en: 'Interactive tools and infographics',
            de: 'Interaktiven Tools und Infografiken',
            pt: 'Ferramentas interativas e infográficos'
        }
    },
    sponsor_info: {
        en: 'This is a special bleh-managed profile to handle sponsors',
        de: 'Dies ist ein bleh verwaltetes Profil zur Verwaltung von Sponsoren',
        pt: 'Este é um perfil especial gerenciado pelo bleh para lidar com apoiadores'
    },
    loading: {
        en: 'Loading',
        de: 'Laden',
        pt: 'Carregando'
    },
    loading_count_days: {
        en: 'Collecting the last {c} days',
        de: 'Sammeln der letzten {c} Tage',
        pt: 'Coletando os últimos {c} dias'
    },
    gathering_plays: {
        en: 'Gathering plays',
        pt: 'Coletando reproduções'
    },
    following_mutuals: {
        // this is appended after the following button text if mutuals
        // eg. Following (mutually)
        en: '(mutually)',
        de: '(gegenseitig)',
        pt: '(mutualmente)'
    },
    language: {
        en: 'Language',
        de: 'Sprache',
        pt: 'Linguagem'
    },
    symbol_presets: {
        // as in a selection of characters (symbols, text) that can
        // be used when editing wikis
        en: 'Symbol presets',
        de: 'Symbol Voreinstellungen',
        pt: 'Predefinições de símbolos'
    },
    fancy_syntax: {
        // hyperlink as in a link to a website or something,
        // common internet word not sure if it translates?
        en: 'Hyperlink guide',
        de: 'Hyperlink Leitfaden',
        pt: 'Guia de hiperlink'
    },
    links_to: {
        // used in wiki editing, {this example} links to {link}
        en: 'Links to {link}',
        de: 'Verlinkt auf {link}',
        pt: 'Links para {link}'
    },
    view_latest_version: {
        en: 'View latest version',
        de: 'Neueste Version anzeigen',
        pt: 'Ver a última versão'
    },
    explore_in_library: {
        en: 'Explore in library',
        de: 'In der Bibliothek anzeigen',
        pt: 'Explorar na biblioteca'
    },
    add_note: {
        // as in a profile note
        en: 'Add note',
        de: 'Notiz hinzufügen',
        pt: 'Adicionar nota'
    },
    radio: {
        en: 'Radio',
        pt: 'Rádio'
    },
    mix: {
        // as in a playlist mix of music
        en: 'Mix'
    },
    recommended: {
        // recommended music
        en: 'Recommended',
        de: 'Empfohlen',
        pt: 'Recomendações'
    },
    listening: {
        // used as the card header for radios and listening reports
        en: 'Listening',
        de: 'Hörverlauf',
        pt: 'Ouvindo'
    },
    you: {
        en: 'You',
        de: 'Du',
        pt: 'Você'
    },
    open: {
        en: 'Open',
        de: 'Öffnen',
        pt: 'Abrir'
    },
    expand: {
        en: 'Expand',
        de: 'Erweitern',
        pt: 'Expandir'
    },
    activity: {
        en: 'Activity',
        de: 'Aktivität',
        pt: 'Atividade',
        listing: {
            shout: {
                en: 'Shout',
                de: 'Shout hinterlassen',
                pt: 'Recado'
            },
            image_upload: {
                en: 'Uploaded image',
                de: 'Bild hochgeladen',
                pt: 'Enviar imagem'
            },
            image_star: {
                en: 'Starred image',
                de: 'Bild favorisiert',
                pt: 'Imagem favoritada'
            },
            obsess: {
                en: 'Obsessed',
                pt: 'Obcecar'
            },
            unobsess: {
                en: 'Removed obsession',
                de: 'Nicht mehr obsessed',
                pt: 'Remover obsessão'
            },
            love: {
                en: 'Loved',
                de: 'Du liebst',
                pt: 'Curtido'
            },
            unlove: {
                en: 'Removed love',
                de: 'Du liebst nicht mehr',
                pt: 'Remover curtida'
            },
            install_bwaa: {
                en: 'Installed bwaa',
                de: 'bwaa installiert',
                pt: 'Instalou bwaa'
            },
            update_bwaa: {
                en: 'Updated bwaa',
                de: 'bwaa aktualisiert',
                pt: 'Atualizou bwaa'
            },
            install_bleh: {
                en: 'Installed bleh',
                de: 'bleh installiert',
                pt: 'Instalou bleh'
            },
            update_bleh: {
                en: 'Updated bleh',
                de: 'bleh aktualisiert',
                pt: 'Atualizou bleh'
            },
            bookmark: {
                en: 'Bookmarked',
                de: 'Lesezeichen hinzugefügt',
                pt: 'Marcado'
            },
            unbookmark: {
                en: 'Removed bookmark',
                de: 'Lesezeichen entfernt',
                pt: 'Remover marcação'
            },
            wiki: {
                en: 'Edited',
                de: 'Editiert',
                pt: 'Editado'
            }
        },
        types: {
            shout: {
                en: 'Comments and replies from you across the site',
                de: 'Kommentare und Antworten von dir auf der gesamten Site',
                pt: 'Comentários e respostas seus ao redor do site'
            },
            image: {
                en: 'Uploading images and starring for your layout',
                de: 'Bilder hochladen und Sterne für Ihr Layout vergeben',
                pt: 'Enviar imagens e favoritando do seu '
            },
            obsess: {
                en: 'Tracks you have on loop',
                de: 'Titel, die du auf Dauerschleife hast',
                pt: 'Faixas que você tem em loop'
            },
            love: {
                en: 'Tracks you love',
                de: 'Titel, die du liebst',
                pt: 'Faixas que você ama'
            },
            bookmark: {
                en: 'Music you want to check out',
                de: 'Musik, die du abchecken solltest',
                pt: 'Música que você quer conferir'
            },
            wiki: {
                en: 'Editing of any wiki',
                de: 'Bearbeiten jeglicher Wiki',
                pt: 'Editando de qualquer wiki'
            },
            install: {
                en: 'First installations and updating',
                de: 'Erstinstallationen und Aktualisierungen',
                pt: 'Primeiras instalações e atualizações'
            }
        }
    },
    what_are_activities: {
        en: 'Keep track of your most recent activity locally on your profile',
        de: 'Verfolge deine letzten Aktivitäten lokal auf dein Profil',
        pt: 'Acompanhe sua atividade mais recente localmente em seu perfil'
    },
    activity_tracking: {
        name: {
            en: 'Track my activities',
            de: 'Meine Aktivitäten tracken',
            pt: 'Acompanhar minhas atividades'
        },
        body: {
            en: 'Activities will only be registered while enabled',
            de: 'Aktivitäten werden nur getracked, wenn du es aktivierst',
            pt: 'As atividades só serão registradas enquanto estiverem habilitadas'
        }
    },
    clear_history: {
        en: 'Clear history',
        pt: 'Limpar histórico'
    },
    cleared_activity_history: {
        en: 'Cleared your activity history',
        de: 'Verlauf löschen',
        pt: 'Histórico de atividades limpo'
    },
    activity_settings: {
        en: 'Activity settings',
        de: 'Aktivitätseinstellungen',
        pt: 'Configurações de atividade'
    },
    installation: {
        en: 'Installation',
        de: 'Installation',
        pt: 'Instalação'
    },
    grid: {
        // as in the view mode
        en: 'Grid',
        de: 'Raster',
        pt: 'Grade'
    },
    list: {
        // as in the view mode
        en: 'List',
        de: 'Liste',
        pt: 'Lista'
    },
    line: {
        // as in the type of chart (a line graph)
        en: 'Line',
        de: 'Liniendiagramm',
        pt: 'Lista'
    },
    pie: {
        // as in the type of chart (a pie chart)
        en: 'Pie',
        de: 'Kreis',
        pt: 'Pizza'
    },
    bar: {
        // as in the type of chart (a bar chart)
        en: 'Bar',
        de: 'Balken',
        pt: 'Barra'
    },
    horizontal: {
        en: 'Horizontal'
    },
    vertical: {
        en: 'Vertical',
        de: 'Vertikal'
    },
    this_year: {
        en: 'This year',
        de: 'Dieses Jahr',
        pt: 'Este ano'
    },
    last_year: {
        en: 'Last year',
        de: 'Letztes Jahr',
        pt: 'Ano passado'
    },
    love: {
        // as in loving tracks as a concept
        en: 'Love',
        de: 'Liebst',
        pt: 'Amar'
    },
    loved: {
        // as in loved tracks, this can be seen
        // in the native last.fm ui
        en: 'Loved',
        de: 'Lieblingslieder',
        pt: 'Curtidas'
    },
    velocity: {
        // as in the last.fm labs 'Velocity' tool
        en: 'Velocity',
        pt: 'Velocidade'
    },
    logout: {
        en: 'Logout',
        de: 'Ausloggen',
        pt: 'Sair'
    },
    tracklist: {
        // please copy from native last.fm ui
        en: 'Tracklist',
        de: 'Titelliste',
        pt: 'Lista de faixas'
    },
    tracklist_from_plays_info: {
        en: 'Retrieved own plays as official tracklist is unavailable',
        de: 'Eigene Plays abgerufen, da die offizielle Titelliste nicht verfügbar ist',
        pt: 'Reproduções próprias recuperadas, pois a lista de faixas oficial não está disponível'
    },
    from_the_album: {
        en: 'From {album}',
        de: 'Aus {album}',
        pt: 'Do {album}'
    },
    listens: {
        // base on native last.fm ui
        en: 'listens',
        de: 'scrobbels',
        pt: 'scrobbles'
        count: {
            en: '{c} listens',
            de: '{c} scrobbels',
            pt: '{c} scrobbles'
        }
    },
    others_count: {
        // the amount of other users
        en: '{c} others',
        de: '{c} weitere',
        pt: '{c} outros'
    },
    loading_album_plays: {
        en: 'Collecting your album plays',
        de: 'Sammeln deiner Albumwiedergaben',
        pt: 'Coletando suas reproduções de álbuns'
    },
    fail_album_plays: {
        en: 'No plays could be found',
        de: 'Es konnten keine Plays gefunden werden',
        pt: 'Nenhuma reprodução pôde ser encontrada'
    },
    open_album_as_track: {
        en: 'Open album title as track',
        de: 'Albumtitel als Titel öffnen',
        pt: 'Abrir título do álbum como faixa'
    },
    ignored: {
        en: 'Ignored',
        de: 'Ignoriert',
        pt: 'Ignorados'
    },
    all_time: {
        en: 'All time',
        de: 'Aller Zeiten',
        pt: 'Todo o período'
    },
    count_total: {
        en: '{c} total',
        de: '{c} insgesamt'
    },
    video_removed: {
        en: 'Video removed by Last.fm',
        de: 'Video von Last.fm entfernt',
        pt: 'Vídeo removido pelo last.fm'
    },
    blocked_page: {
        en: 'This page has been limited by Last.fm',
        de: 'Diese Seite wurde von Last.fm eingeschränkt',
        pt: 'Esta página foi limitada pelo last.fm'
    },
    cancel: {
        en: 'Cancel',
        de: 'Abbrechen',
        pt: 'Cancelar'
    },
    results_for: {
        // used as a header above the actual search eg.
        // Results for
        // "random search text"
        en: 'Results for',
        de: 'Ergebnisse für',
        pt: 'Resultados para'
    },
    create_new_event: {
        en: 'Create new event',
        de: 'Neues Event kreieren',
        pt: 'Criar novo evento'
    },
    related_to: {
        en: 'Related to',
        de: 'Verwandt mit',
        pt: 'Relacionado a'
    },
    personal_tag: {
        en: 'Personal tag',
        de: 'Persönliches Tag',
        pt: 'Marcador pessoal'
    },
    your_avatar: {
        en: 'Your avatar',
        de: 'Dein Avatar',
        pt: 'Sua foto'
    },
    avatar_for_user: {
        // this is used to replace the text and extract the
        // username, so make this text everything BUT where
        // the username goes (including spaces)
        // you can find this text in the last.fm ui as every
        // avatar's (except your own) alt text
        en: 'Avatar for ',
        de: 'Avatar für ',
        pt: 'Avatar de'
    },
    by_artist: {
        // {name} by {artist} - hence the space in english
        en: ' by {a}',
        de: ' von {a}',
        pt: ' por {a}'
    },
    average: {
        // scrobble average
        en: 'Average',
        de: 'Durchschnitt',
        pt: 'Média'
    },
    from_user: {
        en: 'from {u}',
        de: 'Von {u}',
        pt: 'de {u}'
    },
    open_new_tab: {
        en: 'Open in a new tab',
        de: 'Im neuen Tab öffnen ',
        pt: 'Abrir em nova aba'
    },
    event_cancelled: {
        // obviously remove the emoji or replace it as
        // you see fit if desired
        en: 'This event has been cancelled (╥﹏╥)',
        de: 'Dieses Event wurde abgesagt (╥﹏╥)',
        pt: 'Este evento foi cancelado (╥﹏╥)'
    },
    format_guest_features: {
        name: {
            en: 'Smart credited artists and song tags',
            de: 'Schlaue Künstler- und Song-Tags',
            pt: 'Tags inteligentes de artistas e músicas'
        },
        body: {
            en: 'Analyses album and track titles into their guests, versions, remixes, etc.',
            de: 'Analysiert Album- und Tracktitel hinsichtlich ihrer Versionen, Remixe usw.',
            pt: 'Analisa títulos de álbuns e faixas em seus convidados, versões, remixes, etc.'
        }
    },
    show_guest_features: {
        name: {
            en: 'Duplicate credited artists in title',
            de: 'Doppelte Nennung der Künstler im Titel',
            pt: 'Artistas creditados duplicados no título'
        },
        body: {
            en: 'Otherwise guests are neatly placed next to the primary artist',
            de: 'Ansonsten werden Features neben dem Hauptkünstler platziert',
            pt: 'Caso contrário os convidados são organizados de forma elegante ao lado do artista principal'
        }
    },
    track_column_view: {
        en: 'Use column view for tracklist information',
        de: 'Verwende die Spaltenansicht für Titellisteninformationen',
        pt: 'Use a visualização em colunas para as informações da lista de faixas'
    },
    show_remaster_tags: {
        en: 'Show remaster tags',
        de: 'Remaster-Tags anzeigen',
        pt: 'Mostrar as tags de remaster'
    },
    recent_realtime: {
        name: {
            en: 'Refresh tracks automatically',
            de: 'Titel automatisch aktualisieren',
            pt: 'Atualizar faixas automaticamente'
        },
        body: {
            en: 'View your listening history in realtime',
            de: 'Sehe deinen Hörverlauf in Echtzeit an',
            pt: 'Ver seu histórico de scrobbles em tempo real'
        }
    },
    amount_to_display: {
        en: 'Amount to display',
        de: 'Anzuzeigender Betrag',
        pt: 'Quantidade a exibir'
    },
    recent_artwork: {
        en: 'Accompany tracks with artwork',
        de: 'Titel mit Albumcover anzeigen',
        pt: 'Mostrar as faixas junto com a capa'
    },
    default_timeframe: {
        en: 'Default timeframe',
        de: 'Standardzeitrahmen',
        pt: 'Período padrão'
    },
    chart_style: {
        en: 'Chart style',
        de: 'Diagrammstil',
        pt: 'Estilo do gráfico'
    },
    chart_size: {
        en: 'Chart size',
        pt: 'Tamanho do gráfico'
    },
    country: {
        en: 'Country',
        de: 'Land',
        pt: 'País'
    },
    subtitle: {
        en: 'Subtitle',
        de: 'Untertitel',
        pt: 'Legenda'
    },
    pronoun_tip: {
        en: 'Pronouns are specially supported if placed first',
        de: 'Pronomen werden unterstützt, wenn sie an erster Stelle stehen',
        pt: 'Os pronomes são especialmente apoiados se colocados primeiro'
    },
    block_list: {
        en: 'Block list',
        de: 'Blockierliste',
        pt: 'Lista de bloqueados'
    },
    when_blocked: {
        en: 'What happens with blocked users?',
        de: 'Was passiert mit beblockten Nutzern?',
        pt: 'O que acontece com os usuários bloqueados?'
    },
    blocked_count: {
        en: 'You have blocked {c} profiles',
        de: 'Du hast {c} Nutzer blockiert',
        pt: 'Você bloqueou {c} perfis'
    },
    enter_username: {
        en: 'Enter username',
        de: 'Benutzername eingeben',
        pt: 'Insira o nome de usuário'
    },
    block: {
        en: 'Block',
        de: 'Blockieren',
        pt: 'Bloquear'
    },
    blocked: {
        en: 'Blocked',
        pt: 'Bloqueado'
    },
    blocked_user_public: {
        en: 'Can leave shouts but not viewable to you',
        de: 'Kann Shouts hinterlassen, aber nicht sichtbar für dich',
        pt: 'Podem deixar mensagens, mas elas não são visíveis para você'
    },
    blocked_user_message: {
        en: 'Cannot direct message you',
        de: 'Kann keine Direktnachricht senden.',
        pt: 'Não podem lhe enviar mensagens diretas'
    },
    blocked_user_new_shouts: {
        en: 'Cannot leave shouts or reply to you',
        de: 'Kann keine Shouts hinterlassen oder dir antworten',
        pt: 'Não podem deixar mensagens na sua caixa de mensagens ou lhe responder'
    },
    blocked_user_old_shouts: {
        en: 'You cannot delete pre-existing shouts on your profile',
        de: 'Du kannst bereits vorhandene Shouts auf deinem Profil nicht löschen',
        pt: 'Você não pode deletar mensagens já existentes no seu perfil'
    },
    blocked_user_view_profile: {
        en: 'They can still view your profile',
        de: 'Sie können dein Profil weiterhin sehen',
        pt: 'Eles ainda podem ver seu perfil'
    },
    no_quote: {
        en: '...'
    },
    shared_with_others: {
        en: 'Shared with others',
        de: 'Mit anderen geteilt',
        pt: 'Compartilhado com outros'
    },
    others_from_profile: {
        en: 'More from {user}',
        de: 'Mehr von {user}',
        pt: 'Mais de {user}'
    },
    obsess: {
        en: 'Obsess',
        pt: 'Obcecar'
    },
    obsession: {
        en: 'Obsession',
        pt: 'Obsessão'
    },
    obsessions: {
        en: 'Obsessions',
        pt: 'Obsessões'
    },
    finding_your_tracks: {
        en: 'Finding your tracks',
        de: 'Finde deine Titel',
        pt: 'Encontrando suas faixas'
    },
    update_check: {
        en: 'Check for updates',
        de: 'Nach Updates suchen',
        pt: 'Buscar atualizações'
    },
    brand_version_number: {
        // used for the lotus header where:
        // brand = "lotus"
        // number = "2025.0507"
        // making: 'lotus version 2025.0507'
        en: '{brand} version {number}',
        de: '{brand} Version {number}',
        pt: '{brand} versão {number}'
    },
    what_is_lotus: {
        en: 'A capitalisation correction system for artists, albums, and tracks - all powered by community contributions.',
        de: 'Ein System zur Korrektur der Groß- und Kleinschreibung von Künstlern, Alben und Titeln - alles unterstützt durch Beiträge der Community.',
        pt: 'Um sistema de correção de capitalização para artistas, álbuns e faixas - tudo alimentado por contribuições da comunidade.'
    },
    correct_titles_with_lotus: {
        en: 'Correct titles with lotus',
        de: 'Titel korrigieren mit Lotus',
        pt: 'Corrigir títulos com lotus'
    },
    view_all: {
        en: 'View all',
        de: 'Alle ansehen',
        pt: 'Ver tudo'
    },
    help_contribute: {
        en: 'Help contribute',
        de: 'Helfe mit',
        pt: 'Ajude a contribuir'
    },
    delete: {
        en: 'Delete',
        de: 'Löschen',
        pt: 'Deletar'
    },
    search: {
        en: 'Search',
        de: 'Suchen',
        pt: 'Pesquisa'
    },
    search_guest: {
        en: 'Search guest appearances',
        de: 'Suche nach Features',
        pt: 'Buscar participações especiais'
    },
    anything_you_can_imagine: {
        // placeholder for your about me
        en: 'Anything you can imagine...',
        de: 'Alles, was du dir vorstellen kannst ...',
        pt: 'Tudo que você pode imaginar...'
    },
    supports_markdown: {
        // markdown: https://www.markdownguide.org/cheat-sheet/
        en: 'Supports Markdown',
        de: 'Unterstützt Markdown',
        pt: 'Suporta o Markdown'
    },
    profile_shortcut: {
        name: {
            en: 'Profile shortcut',
            de: 'Profilverknüpfung',
            pt: 'Atalho de perfil'
        },
        body: {
            en: 'View their scrobbles alongside yours at all times',
            de: 'Sehe ihre Scrobbels jederzeit neben deine an',
            pt: 'Veja os scrobbles deles junto aos seus o tempo todo'
        },
        linked: {
            en: 'Linked with {u}',
            pt: 'Ligado com {u}'
        },
        notice: {
            en: 'You already have {u} as your shortcut, are you sure?',
            pt: 'Você já tem {u} como seu atalho, você tem certeza?'
        }
    },
    failed_to_find_profile: {
        en: 'Failed to find profile',
        pt: 'Falha ao achar perfil'
    },
    replace: {
        en: 'Replace',
        pt: 'Substituir'
    },
    view_others_library: {
        en: 'View others library',
        pt: 'Ver a biblioteca dos outros'
    },
    avatar_radius: {
        en: 'Profile avatar shape',
        de: 'Profil-Avatarform',
        pt: 'Formato da imagem de perfil'
    },
    notes: {
        en: 'Notes',
        de: 'Notizen',
        pt: 'Notas'
    },
    no_notes: {
        en: 'No profiles here... (｡•́︿•̀｡)',
        de: 'Keine Profile hier... (｡•́︿•̀｡)',
        pt: 'Sem perfis aqui... (｡•́︿•̀｡)'
    },
    font: {
        name: {
            en: 'Font choice',
            de: 'Schriftartauswahl',
            pt: 'Escolha de fonte'
        },
        body: {
            en: 'Choose a custom selection of fonts that suit you',
            de: 'Wähle eine benutzerdefinierte Auswahl an Schriftarten, die zu dir passt',
            pt: 'Selecione uma fonte customizada que te agrada'
        }
    },
    font_weight: {
        name: {
            en: 'Font weight',
            de: 'Schriftstärke',
            pt: 'Espessura da fonte'
        },
        body: {
            en: 'Used for regular text paragraphs',
            de: 'Wird für normale Textabsätze verwendet',
            pt: 'Usado para parágrafos regulares de texto'
        }
    },
    font_weight_medium: {
        name: {
            en: 'Medium font weight',
            de: 'Mittlere Schriftstärke',
            pt: 'Espessura média de fonte'
        },
        body: {
            en: 'Used for button text and small headers',
            de: 'Wird für Schaltflächentext und kleine Überschriften verwendet',
            pt: 'Usada para texto de botões e pequenos cabeçalhos'
        }
    },
    font_weight_bold: {
        name: {
            en: 'Bold font weight',
            de: 'Fette Schriftstärke',
            pt: 'Espessura da fonte em negrito'
        },
        body: {
            en: 'Used for large headers',
            de: 'Wird für große Überschriften verwendet',
            pt: 'Usado para cabeçalhos grandes'
        }
    },
    font_emoji: {
        name: {
            en: 'Emoji compatibility',
            de: 'Emoji-Kompatibilität',
            pt: 'Compatibilidade de emojis'
        },
        body: {
            en: 'Required to render emoji properly before Windows 11 🏳️‍⚧️',
            de: 'Erforderlich, um Emojis vor Windows 11 richtig darzustellen 🏳️‍⚧️',
            pt: 'Necessário para renderizar emojis corretamente antes do Windows 11 🏳️‍⚧️'
        }
    },
    enter_font_names: {
        en: 'Enter installed font name(s), separated by commas',
        de: 'Geben die installierte Schriftart durch Kommas getrennt ein',
        pt: 'Digite os nomes das fontes instaladas, separados por vírgulas'
    },
    change_now: {
        en: 'Change now',
        de: 'Jetzt ändern',
        pt: 'Mudar agora'
    },
    profiles: {
        en: 'Profiles',
        de: 'Profile',
        pt: 'Perfis'
    },
    redirections: {
        en: 'Redirections',
        de: 'Umleitungen',
        pt: 'Redirecionamentos'
    },
    legacy_redirects: {
        name: {
            en: 'Legacy scrobble redirection',
            de: 'Legacy-Scrobbel-Umleitung',
            pt: 'Redirecionamento de scrobble legado'
        },
        body: {
            en: 'By default, Last.fm will "auto-correct" some of your scrobbles to (mostly) faulty redirections. By disabling this it does not fully fix the system but keeps artist names in your library intact.',
            de: 'Standardmäßig korrigiert Last.fm einige deiner Scrobbel-Dateien automatisch und führt (meist) fehlerhafte Weiterleitungen aus. Durch die Deaktivierung dieser Funktion wird das System zwar nicht vollständig repariert, die Künstlernamen in Ihrer Bibliothek bleiben jedoch erhalten.',
            pt: 'Por padrão, o Last.fm irá "corrigir automaticamente" alguns dos seus scrobbles para redirecionamentos (na maioria) defeituosos. Desativar essa opção não corrige completamente o sistema, mas mantém os nomes dos artistas na sua biblioteca intactos.'
        }
    },
    redirect_messages: {
        name: {
            en: 'Remove page redirection notifications',
            de: 'Benachrichtigungen zur Seitenumleitung entfernen',
            pt: 'Remover notificações de redirecionamento de página'
        },
        body: {
            en: 'These notifications can let you undo redirections Last.fm forced upon you, but can also be annoying',
            de: 'Mit diesen Benachrichtigungen kannst du die von Last.fm aufgezwungenen Weiterleitungen rückgängig machen, sie können aber auch lästig sein.',
            pt: 'Essas notificações podem permitir que você desfaça redirecionamentos que o Last.fm impôs a você, mas também podem ser irritantes'
        }
    },
    colourful_counts: {
        name: {
            en: 'Rank-based colours for artist charts',
            de: 'Rangbasierte Farben für Künstlerdiagramme',
            pt: 'Cores baseadas em classificação para paradas de artistas'
        },
        body: {
            en: 'Assigns a colour based on an artist\'s all-time ranking in your library',
            de: 'Weist eine Farbe basierend auf dem Allzeit-Ranking eines Künstlers in deiner Bibliothek zu',
            pt: 'Define uma cor pela colocação do artista no ranking geral da sua biblioteca.'
        }
    },
    glacier_graphs: {
        name: {
            en: 'Visualise scrobble graphs better',
            de: 'Scrobbel-Diagramme besser visualisieren',
            pt: 'Visualize melhor os gráficos de scrobble'
        },
        body: {
            en: 'Choose between a tiny delay for a wide range of graph options or legacy Last.fm graphs',
            de: 'Wähle zwischen einer kleinen Verzögerung für eine breite Palette von Diagrammoptionen oder älteren Last.fm-Diagrammen',
            pt: 'Escolha entre um pequeno atraso para ter mais opções de gráficos ou usar os gráficos clássicos do Last.fm'
        }
    },
    show_bulk_edit_album: {
        name: {
            en: 'Show "Bulk Edit" powered album name in tracklists',
            de: 'Albumnamen mit „Massenbearbeitung“ in Titellisten anzeigen',
            pt: 'Exibir o nome do álbum ajustado pelo "Bulk Edit" nas listas de faixas.'
        },
        body: {
            en: 'With this extension the album name is displayed on all tracks by default, whereas with bleh the album name is only displayed on active tracks',
            de: 'Mit dieser Erweiterung wird der Albumname standardmäßig auf allen Titeln angezeigt, während mit bleh der Albumname nur auf aktiven Titeln angezeigt wird',
            pt: 'Com esta extensão, o nome do álbum é exibido em todas as faixas por padrão, enquanto no bleh ele é mostrado apenas nas faixas que estão sendo tocadas no momento.'
        }
    },
    gendered_tags: {
        name: {
            en: 'Hide gender-based tags',
            de: 'Geschlechtsspezifische Tags ausblenden',
            pt: 'Esconder tags baseadas em gênero'
        },
        body: {
            en: 'These tags are often redundant and can never apply to the full range of what they\'re intending',
            de: 'Diese Tags sind oft überflüssig und können nie auf die gesamte Bandbreite dessen angewendet werden, was sie beabsichtigen',
            pt: 'Essas tags costumam ser redundantes e nunca conseguem representar totalmente tudo o que se propõem'
        }
    },
    artwork_and_grids: {
        en: 'Artwork and grids',
        de: 'Albencover und Raster',
        pt: 'Capas e grades'
    },
    gloss: {
        name: {
            en: 'Gloss overlay',
            de: 'Glanz-Overlay',
            pt: 'Sobreposição brilhante'
        },
        body: {
            en: 'Very shiny',
            de: 'Sehr glänzend',
            pt: 'Muito reluzente'
        }
    },
    grid_glow: {
        name: {
            en: 'Reflect colour below grid items',
            de: 'Farbe unter Rasterelementen reflektieren',
            pt: 'Refletir a cor abaixo dos itens da grade'
        },
        body: {
            en: 'Glows in the colour of said album cover',
            de: 'Leuchtet in der Farbe des Albumcovers',
            pt: 'Brilha na cor da capa do álbum'
        }
    },
    skip_to: {
        en: 'Skip to',
        de: 'überspringen zu',
        pt: 'Pular para'
    },
    information: {
        en: 'Information',
        pt: 'Informação'
    },
    username: {
        name: {
            en: 'Username',
            de: 'Benuztername',
            pt: 'Nome de usuário'
        },
        body: {
            en: 'To change your username hit the button to send an email. Having problems? {a}contact support{/a}.',
            de: 'Um deinen Nutzernamen zu ändern, klicke auf die Schaltfläche „E-Mail senden“. Gibt es Probleme? {a}kontaktieren Sie den Support{/a}.',
            pt: 'Para alterar seu nome de usuário, clique no botão para enviar um e-mail. Está com problemas?'
        }
    },
    email: {
        en: 'Email'
        pt: 'E-mail'
    },
    password: {
        en: 'Password',
        de: 'Passwort',
        pt: 'Senha'
    },
    new_password: {
        en: 'New password',
        de: 'Neues Passwort',
        pt: 'Nova senha'
    },
    confirm_password: {
        en: 'Confirm password',
        de: 'Passwort bestätigen',
        pt: 'Confirmar senha'
    },
    change: {
        en: 'Change',
        de: 'Ändern',
        pt: 'Mudar'
    },
    marketing_emails: {
        name: {
            en: 'Marketing emails',
            pt: 'E-mails promocionais'
        },
        body: {
            en: 'Last.fm can optionally send promotional emails from time to time',
            de: 'Last.fm kann optional von Zeit zu Zeit Werbe-emails senden',
            pt: 'O Last.fm pode, opcionalmente, enviar e-mails promocionais de tempos em tempos.'
        }
    },
    email_language: {
        en: 'Email language',
        de: 'Email Sprache',
        pt: 'Idioma dos e-mails'
    },
    communication: {
        en: 'Communication',
        de: 'Kommunikation',
        pt: 'Comunicação'
    },
    security: {
        en: 'Security',
        de: 'Sicherheit',
        pt: 'Segurança'
    },
    logout_everywhere: {
        en: 'Logout on all devices',
        de: 'Auf allen Geräten abmelden',
        pt: 'Encerrar sessão em todos os dispositivos'
    },
    delete_account: {
        name: {
            en: 'Delete account',
            de: 'Account löschen',
            pt: 'Deletar conta'
        },
        body: {
            en: 'Deletion will take 14 days to complete, after this time your account will either be deleted, anonymised, or put beyond use and cannot be recovered. Once deleted, your username will no longer be available.',
            de: 'Die Löschung dauert 14 Tage. Nach Ablauf dieser Frist wird dein Konto entweder gelöscht, anonymisiert, oder unbrauchbar gemacht und kann nicht wiederhergestellt werden. Nach der Löschung ist dein Nutzername nicht mehr verfügbar.',
            pt: 'A exclusão levará 14 dias para ser concluída. Após esse período, sua conta será excluída, anonimizada ou desativada, e não poderá ser recuperada. Depois de excluída, seu nome de usuário não estará mais disponível.'
        }
    },
    delete_account_permanently: {
        en: 'Delete {u} permanently',
        de: '{u} dauerhaft löschen',
        pt: 'Deletar {u} permanentemente'
    },
    connect_app: {
        en: 'Connect {name}',
        de: 'Verbinde {name}',
        pt: 'Conectar {name}'
    },
    connect: {
        en: 'Connect',
        de: 'Verbinden',
        pt: 'Conectar'
    },
    app_would_like_to_connect: {
        // app name is above
        en: 'would like to use your account',
        de: 'möchte Ihr Konto nutzen',
        pt: 'gostaria de usar sua conta'
    },
    logged_in_as: {
        en: 'Logged in as {user}',
        de: 'Angemeldet als {user}',
        pt: 'Conectado como {user}'
    },
    ensure_you_trust: {
        // API applications
        // last.fm/settings/applications
        en: 'Make sure you trust this application',
        de: 'Stelle sicher, dass du dieser Anwendung vertraust',
        pt: 'Certifique-se de que você confia neste aplicativo'
    },
    you_can_now_close_this_tab: {
        en: 'You can now close this tab',
        de: 'Du kannst diesen Tab jetzt schließen',
        pt: 'Você pode fechar esta aba agora'
    },
    manage_applications: {
        // API applications
        // last.fm/settings/applications
        en: 'Manage applications',
        de: 'Anwendungen verwalten',
        pt: 'Gerenciar aplicações'
    },
    markdown_profiles: {
        name: {
            en: 'Use fancy formatting on profiles',
            de: 'Verwende schicke Formatierungen für Profile',
            pt: 'Usar formatação estilosa nos perfis'
        },
        body: {
            en: 'Allows the use of line breaks, bold text, italics, and images in all "About Me" panels',
            de: 'Ermöglicht die Verwendung von Zeilenumbrüchen, fettem Text, Kursivschrift und Bildern in allen „Über mich“-Bereichen',
            pt: 'Permite o uso de quebras de linha, texto em negrito, itálico e imagens em todos os painéis "Sobre mim"'
        }
    },
    markdown_shouts: {
        name: {
            en: 'Use fancy formatting on shouts',
            pt: 'Usar formatação estilosa nas caixas de mensagens'
        },
        body: {
            en: 'Allows the use of line breaks, bold text, italics, and images in all shouts',
            pt: 'Permite o uso de quebras de linha, texto em negrito, itálico e imagens em todas as caixas de mensagens'
        },
        preview: {
            en: 'hello! **hello!** *hello!*\n[here\'s a link](https://katelyn.moe) HAII @stellasaur',
            pt: 'opa! **opa!** *opa!*\n[aqui\'está um link](https://katelyn.moe) OIEE @stellasaur'
        }
    },
    gathering_your_plays: {
        en: 'Gathering your album plays',
        de: 'Sammeln deiner Albumwiedergaben',
        pt: 'Coletando suas reproduções de álbuns'
    },
    failed_to_find_tracks: {
        en: 'You do not have any plays',
        de: 'Du hast keine Plays',
        pt: 'Você não tem nenhuma reprodução'
    },
    sourced_from_own_plays: {
        // tracklist from your own album plays
        en: 'Sourced from your own plays as an official tracklist is unavailable',
        de: 'Aus deinen eigenen Plays stammend, da keine offizielle Titelliste verfügbar ist',
        pt: 'Baseado nas suas próprias reproduções, pois a tracklist oficial não está disponível'
    },
    submit_language: {
        name: {
            en: 'Are you fluent in a supported language?',
            pt: 'Você é fluente em algum dos idiomas suportados?'
        },
        body: {
            en: 'Translations are powered by community contributions from wonderful people like you',
            pt: 'As traduções são feitas graças às contribuições da comunidade, de pessoas incríveis como você'
        }
    },
    welcome_to_bleh: {
        en: 'Welcome to bleh, thank you for installing!<br>You can continue through this quick setup to get you started or skip right to your profile and figure it all out yourself <3',
        pt: 'Bem-vindo ao bleh, obrigado por instalar!<br>Você pode seguir este rápido guia de configuração para começar, ou pular direto para seu perfil e descobrir tudo por conta própria <3'
    },
    next: {
        en: 'Next',
        pt: 'Próximo'
    },
    choose_a_theme: {
        en: 'Choose a theme that suits you best!',
        pt: 'Escolha o tema que mais combina com você'
    },
    accessibility_explain: {
        en: 'Before we continue, let\'s assess your accessibility settings.',
        pt: 'Antes de continuarmos, vamos acessar suas configurações de acessibilidade'
    },
    colours_explain: {
        en: 'Choose a colour you like or make your own favourite.',
        pt: 'Escolha uma cor que você goste ou crie a sua favorita'
    },
    music_explain: {
        en: 'We offer a variety of options to help you manage your music library.',
        pt: 'Nós oferecemos uma variedade de opções para ajudar você a gerenciar sua biblioteca musical'
    },
    setup_end: {
        en: 'That\'s all for now, to configure your bleh installation in the future head to {a}the settings{/a} in your menu!',
        pt: 'Por enquanto isso é tudo, para configurar sua instalação do bleh futuramente, vá até {a}nas configurações{/a} no seu menu!'
    },
    seasonal_particles: {
        name: {
            en: 'Show particles during select seasons',
            pt: 'Mostrar particulas durante estações selecionadas'
        },
        body: {
            en: 'During Winter seasons watch pretty snowflakes fall :3',
            pt: 'Durante as sessões de inverno, veja flocos de neve bonitinhos caindo :3'
        }
    },
    all_particles: {
        en: 'Show full particles',
        pt: 'Mostrar partículas completas'
    },
    less_particles: {
        en: 'Show less particles',
        pt: 'Mostrar menos partículas'
    },
    no_particles: {
        en: 'Disable particles',
        pt: 'Desativar partículas'
    },
    going: {
        en: '{c} going',
        pt: '{c} indo'
    },
    maybe: {
        en: '{c} interested',
        pt: '{c} interessado'
    },
    branch: {
        name: {
            en: 'Branch name',
            pt: 'Nome do branch'
        },
        body: {
            en: 'Control which development branch you are using',
            pt: 'Controle qual branch de desenvolvimento você está usando'
        }
    },
    enter_branch_name: {
        en: 'Type branch name (default is uwu)',
        pt: 'Digite o nome da branch (padrão é uwu)'
    },
    beware_notice: {
        en: 'Beware! Only change these settings if you know what you\'re doing',
        pt: 'Cuidado! Apenas mude estas configurações se você sabe o que você está fazendo'
    },
    privacy: {
        en: 'Privacy',
        de: 'Datenschutz',
        pl: 'Prywatność',
        pt: 'Privacidade'
    },
    recent_listening: {
        name: {
            en: 'Hide your recent listening history',
            pt: 'Esconde seu histórico de scrobbles recente'
        },
        body: {
            en: 'Keeps your activity more private',
            pt: 'Mantem sua atividade mais privada'
        }
    },
    allow_messages_from: {
        en: 'Allow messages from',
        pt: 'Permitir mensagens de'
    },
    everyone: {
        en: 'Everyone',
        pt: 'Todo mundo'
    },
    following_and_neighbours: {
        en: 'Following and neighbours',
        pt: 'Seguindo e vizinhos'
    },
    close_shouts: {
        name: {
            en: 'Close my shoutbox',
            pt: 'Fechar minha caixa de mensagens'
        },
        body: {
            en: 'Removes visibility from everyone (including you)',
            pt: 'Remove a visibilidade de todos (incluindo você)'
        }
    },
    error: {
        en: 'Error',
        pt: 'Erro'
    },
    erm: {
        // used when a page is taken down
        en: 'erm...',
        pt: 'puts...'
    },
    shortcut: {
        en: 'Shortcut',
        pt: 'Atalho'
    },
    last_count_days: {
        en: 'Last {c} days',
        pt: 'Últimos {c} dias'
    },
    choose_a_timeframe_above: {
        en: 'Choose a timeframe above',
        pt: 'Escolha um prazo acima'
    },
    failed: {
        en: 'Failed',
        pt: 'Falhou'
    },
    there_was_a_network_error: {
        en: 'There was a network error',
        pt: 'Houve um erro de rede'
    },
    support: {
        en: 'Support',
        pt: 'Suporte'
    },
    accessible_name_colours: {
        name: {
            en: 'Prefer accessible name colours',
            pt: 'Preferir nomes de cores acessíveis'
        },
        body: {
            en: 'Replaces badge and link-coloured names with your theme\'s header colour',
            pt: 'Substitui os nomes coloridos dos emblemas e links pela cor do cabeçalho do seu tema'
        }
    },
    underline_links: {
        name: {
            en: 'Always underline links',
            pt: 'Sempre sublinhe os links'
        },
        body: {
            en: 'Forces buttons, links, and other interactables to have an underline',
            pt: 'Força botões, links e outros interativos a terem um sublinhado'
        }
    },
    upload: {
        en: 'Upload',
        pt: 'Enviar'
    },
    change_avatar: {
        en: 'Change avatar',
        pt: 'Mudar foto de perfil'
    }
}

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
                'subscription_automatic-edits_albums': 'album auto edits · settings',
                'subscription_automatic-edits_tracks': 'track auto edits · settings',
                applications_overview: 'applications · settings',
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
                tags_overview: '{name} · profile tags',
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
                name: 'it\'s a kitty!!'
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
            tooltip: 'lotus is the community correction system used in bleh and bwaa',
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
            seasonal_notice: 'To watch the counter update live, click and stay on the tab that opens.',
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
                        one_time: 'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version: 'You have version {v} of the sponsorship/badge data downloaded.'
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
                    bio: 'Quickly access a user\'s plays on an artist, album, or track page.',
                    placeholder: 'Profile',
                    header: 'Enter username',
                    saved: 'Profile shortcut is valid',
                    failed: 'Profile does not exist or failed to load'
                },
                show_bulk_edit_album: {
                    name: 'Show album in chartlists',
                    bio: 'This is disabled by default as hovering over tracks reveals the album title in all areas',
                    require: 'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Accessibility',
                shout_preview: 'some completely random text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
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
                            seasonal_alert: 'The current season is overriding your accent colour, adjust sliders to disable.'
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
                        disabled: 'You have seasons disabled, enable to view current event.'
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
                            next_step: 'Once you have the extension installed, hit "Install style" on the new tab that will open.'
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
                    edit_user: 'Edit {u}\'s note',
                    delete_user: 'Remove {u}\'s note',
                    view: 'View your profile notes'
                },
                you: 'You',
                avatar_radius: {
                    name: 'User avatar shape'
                },
                api: {
                    name: 'API access',
                    bio: 'Enter a Last.fm API key to use new features, such as:',
                    features: [
                        {}
                    ],
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
                bio: 'Manage last.fm\'s (not) handy redirection system as best as possible.',
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: 'No, I didn\'t mean Travi$ Scott'
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: 'By default, last.fm will \'auto-correct\' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.',
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
                    bio: 'Nobody likes remasters (or the tags), if you\'d prefer to still listen but remove the annoyance hide them!'
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
                shout_preview_md: 'some <strong>completely</strong> random!<br>text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                shout_preview: 'some completely random! text that doesn\'t mean anything at all',
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
                    pronoun_tip: 'When pronouns are placed first, "aka." will change to "pronouns".',
                    country: 'Country',
                    website: 'Website',
                    about: 'About',
                    toggle_preview: {
                        name: 'Toggle preview',
                        bio: 'Preview how your bio looks to others',
                        note: 'For non-bleh users, multiple lines display as spaces and links, bold, italics will be plain text. Any images embedded will appear as manic text, so be aware.'
                    },
                    banner_tip: 'Images can be embedded using ![](link). You can also set a custom profile banner with ![banner](link).',
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
                    'If you\'re already set, you can skip.'
                ],
                pick_theme: 'Which theme would you prefer?',
                change_later: 'You can modify all your settings at any time.'
            },
            appearance: {
                name: 'Your colour',
                bio: 'Configure the colour of bleh from one of the available presets, or make your own colour combination!',
                subtext: 'During seasonal events, the default colour changes automatically.'
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
                reason: 'Für besondere Nutzer reserviert'
            },
            reserved: {
                reason: 'Für bestimmte Nutzer reserviert'
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
            tooltip: 'lotus is the community correction system used in bleh and bwaa',
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
            dev: 'Toggle dev mode',
            configure_bleh: 'bleh konfigurieren',
            library: 'Bibliothek',
            shouts: 'Shouts',
            obsessions: 'Obsessionen',
            labs: 'Labor',
            bookmarks: 'Lesezeichen',
            settings: 'Einstellungen',
            logout: 'Ausloggen'
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
                    css: 'Stil aktualisieren',
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
                        one_time: 'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version: 'You have version {v} of the sponsorship/badge data downloaded.'
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
                bio: 'Konfiguriere deine musikbezogene Einstellungen für Profile, Künstler, Alben und Titel.',
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
                    require: 'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Zugänglichkeit',
                shout_preview: 'some completely random text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
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
                            preface: 'Farben werden durch drei Werte gesteuert: Farbton, Sättigung und Helligkeit. Probiere den Schieberegler aus, um ein Gefühl dafür zu bekommen.',
                            hue: 'Akzentfarbe',
                            sat: 'Sättigung',
                            lit: 'Helligkeit',
                            seasonal_alert: 'Die aktuelle Saison überschreibt deine Akzentfarbe. Passe den Schieberegler an, um sie zu deaktivieren.'
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
                        disabled: 'Saisons sind deaktiviert. Aktiviere diese, um die aktuelle Saison anzuzeigen.'
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
                    exclusive_for_season: 'Exclusive for <span class="season-name">{season}</span>',
                    exclusive_for_season_and_more: 'Exclusive for <span class="season-name">{season}</span> and 1 more',
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
                            next_step: 'Once you have the extension installed, hit "Install style" on the new tab that will open.'
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
                    edit_user: 'Edit {u}\'s note',
                    delete_user: 'Remove {u}\'s note',
                    view: 'View your profile notes'
                },
                you: 'You'
            },
            redirects: {
                name: 'Weiterleitungen',
                bio: 'Manage last.fm\'s (not) handy redirection system as best as possible.',
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: 'No, I didn\'t mean Travi$ Scott'
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: 'By default, last.fm will \'auto-correct\' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.',
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
                    bio: 'Nobody likes remasters (or the tags), if you\'d prefer to still listen but remove the annoyance hide them!'
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
                shout_preview_md: 'some <strong>completely</strong> random!<br>text that doesn\'t mean <a href="https://cutensilly.org">anything at all</a>',
                shout_preview: 'some completely random! text that doesn\'t mean anything at all',
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
                    pronoun_tip: 'Wenn Pronomen an den Anfang gestellt werden, ändert sich „aka.“ in „Pronomen“.',
                    country: 'Land',
                    website: 'Website',
                    about: 'Über mich',
                    toggle_preview: {
                        name: 'Vorschau umschalten',
                        bio: 'Vorschau deiner biographie für andere',
                        note: 'Für nicht bleh Benutzer, mehrere Zeilen werden als Leerzeichen und Links angezeigt, Fett- und Kursivschrift wird als einfacher Text angezeigt. Jegliche eingelegte Bilder werden als Text angezeigt.'
                    },
                    banner_tip: 'Bilder können mithilfe von ![](link) eingelegt werden. Du kannst auch ein benutzerdefiniertes Banner mithilfe von ![banner](link) festlegen.',
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
                    'If you\'re already set, you can skip.'
                ]
            },
            appearance: {
                bio: 'Configure the colour of bleh from one of the available presets, or make your own colour combination!',
                subtext: 'During seasonal events, the default colour changes automatically.'
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
                name: 'it\'s a kitty!!'
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
            tooltip: 'lotus is the community correction system used in bleh and bwaa',
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
                        one_time: 'A custom badge is available only when selecting monthly.'
                    },
                    manage: 'Manage sponsorship',
                    check: 'Refresh badges',
                    download: 'Sponsorship and badge data downloaded!',
                    version: 'You have version {v} of the sponsorship/badge data downloaded.'
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
                    bio: 'Quickly access a user\'s plays on an artist, album, or track page.',
                    placeholder: 'Profile',
                    header: 'Enter username',
                    saved: 'Profile shortcut is valid',
                    failed: 'Profile does not exist or failed to load'
                },
                show_bulk_edit_album: {
                    name: 'Show album in chartlists',
                    bio: 'This is disabled by default as hovering over tracks reveals the album title in all areas',
                    require: 'Only applicable with the ‘Last.fm Bulk Edit’ extension'
                },
                grid_glow: {
                    name: 'Show a glow around grid items'
                }
            },
            accessibility: {
                name: 'Accessibility',
                shout_preview: 'jakikolwiek losowy tekst, który <a href="https://cutensilly.org">nic nie znaczy</a>',
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
                            preface: 'Kolory są kontrolowane przez trzy wartości: odcień (hue), nasycenie (saturation) i jasność (lightness). Przesuń suwaki, aby dostosować kolor.',
                            hue: 'Kolor akcentu (hue)',
                            sat: 'Nasycenie (saturation)',
                            lit: 'Jasność (lightness)',
                            seasonal_alert: 'The current season is overriding your accent colour, adjust sliders to disable.'
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
                        disabled: 'You have seasons disabled, enable to view current event.'
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
                    exclusive_for_season: 'Exclusive for <span class="season-name">{season}</span>',
                    exclusive_for_season_and_more: 'Exclusive for <span class="season-name">{season}</span> and 1 more',
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
                            next_step: 'Gdy już zainstalujesz rozszerzenie, kliknij "Zainstaluj styl" na nowej karcie, która się otworzy.'
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
                    placeholder: 'Wprowadź lokalną notatkę dla tego użytkownika',
                    edit: 'Edytuj notatkę',
                    delete: 'Usuń notatkę',
                    edit_user: 'Edytuj notatkę dla {u}',
                    delete_user: 'Usuń notatkę dla {u}'
                },
                you: 'You'
            },
            redirects: {
                name: 'Redirects',
                bio: 'Manage last.fm\'s (not) handy redirection system as best as possible.',
                travis: {
                    name: 'Hide redirect messages on music pages',
                    bio: 'No, I didn\'t mean Travi$ Scott'
                },
                autocorrect: {
                    name: 'Scrobble auto-correction',
                    bio: 'By default, last.fm will \'auto-correct\' some of your scrobbles using this system. This will make your scrobbles appear as <i>Travis Scott</i> rather than <i>Travi$ Scott</i>, however the redirection system is not fully disabled.',
                    action: 'Open Settings'
                }
            },
            corrections: {
                name: 'Corrections',
                bio: 'Manage bleh\'s in-built correction system for artist, album, and track titles.',
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
                    bio: 'Nobody likes remasters (or the tags), if you\'d prefer to still listen but remove the annoyance hide them!'
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
                shout_preview_md: 'jakikolwiek <strong>losowy</strong> tekst,<br>który <a href="https://cutensilly.org">nic nie znaczy</a>',
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
                    pronoun_tip: 'Jeśli zaimki są umieszczone jako pierwsze, "aka." zmieni się na "zaimki".',
                    country: 'Kraj',
                    website: 'Strona internetowa',
                    about: 'O mnie',
                    toggle_preview: {
                        name: 'Przełącz podgląd',
                        bio: 'Podgląd, jak twój profil wygląda dla innych',
                        note: 'Uwaga: Nowe linie, linki itp. są widoczne tylko dla innych użytkowników bleh, zwykli użytkownicy Last.fm widzą nowe linie jako spacje.'
                    },
                    banner_tip: 'Images can be embedded using ![](link). You can also set a custom profile banner with ![banner](link).',
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
    },
}
moment.updateLocale('de', {
    relativeTime : {
        future: 'in %s',
        past:   'vor %s',
        s:      'ein paar Sekunden',
        ss:     '%d Sekunden',
        m:      'eine Minute',
        mm:     '%d Minuten',
        h:      'eine Stunde',
        hh:     '%d Stunden',
        d:      'ein Tag',
        dd:     '%d Tagen',
        w:      'eine Woche',
        ww:     '%d Wochen',
        M:      'im Monat',
        MM:     '%d Monate',
        y:      'ein Jahr',
        yy:     '%d Jahre'
    }
});
moment.updateLocale('pt', {
    relativeTime : {
        future: 'em %s',
        past:   'faz %s',
        s:      'alguns Segundos',
        ss:     '%d Segundos',
        m:      'um Minuto',
        mm:     '%d Minutos',
        h:      'uma Hora',
        hh:     '%d Horas',
        d:      'um Dia',
        dd:     '%d Dias',
        w:      'uma Semana',
        ww:     '%d Semanas',
        M:      'um Mês',
        MM:     '%d Meses',
        y:      'um Ano',
        yy:     '%d Anos'
    }
});

export function tl(key) {
    if (!key) {
        log('your key is undefined', 'trans');
        return 'NO_TRANSLATION_FOUND';
    }

    if (key[lang])
        return key[lang];

    log(`no translation found for ${JSON.stringify(key)}`, 'trans');
    return key.en;
}

export function lookup_lang() {
    const troot = document.querySelector('.masthead-logo a');

    console.log(troot)
    if (!troot) {
        handle_error_500();
        return;
    }

    console.log(troot.getAttribute("href"));

    setRoot(troot.getAttribute('href'));

    let previous_avi = auth.avatar;
    if (auth_link.state) {
        auth.avatar = auth_link.state.querySelector('img').getAttribute('src');

        if (auth.avatar != previous_avi) {
            let avatar = auth_link.state.querySelector('img');
            avatar.setAttribute('crossorigin', 'anonymous');

            try {
                avatar.addEventListener('load', function() {
                    let thief = new ColorThief();
                    let colour = thief.getColor(avatar);

                    let hsl = rgb_to_hsl(colour[0], colour[1], colour[2]);

                    auth.sets.hue = hsl.h;
                    auth.sets.sat = clamp_sat((hsl.s / 100) * 3);
                    auth.sets.lit = 1;
                });
            } catch(e) {}
        }
    }
    lang = document.documentElement.getAttribute('lang');

    moment.locale(lang);
}