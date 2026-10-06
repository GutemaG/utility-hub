export const ENGLISH_WORDS = `the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line city put close case force meet once water upon war build hear light unite live every country bring center let side try provide continue name certain power pay result question study woman member until far night always service away report something company week church toward start social room figure nature though young less enough almost read include president nothing yet better big boy cost business value second why clear expect family complete act sense mind experience art next near direct car law industry important girl god several matter usual rather per often kind among white reason action return foot care simple within love human along appear doctor believe speak active student month drive concern best door hope example inform body ever least probable understand reach effect different idea whole control condition field pass fall note special talk particular today measure walk teach low hour type carry rate remain full street easy although record sit determine level local sure receive thus moment spirit train college religion perhaps music grow free cause serve age book board recent sound office cut step class true history position above strong friend necessary add court deal tax support party whether either land material happen education death agree arm mother across quite anything town past view society manage answer break organize half fire lose money stop actual already effort wait department able political learn voice air together shall cover common subject draw short wife treat limit road letter color behind produce send term total university rise century success minute remember purpose test fight watch situation south ago difference stage father table rest bear entire market prepare explain offer plant charge ground west picture hard front lie modern dark surface rule regard dance peace observe future wall farm claim firm operation further pressure property morning amount top outside piece sometimes beauty trade fear demand wonder list accept judge paint mile soon responsible allow secretary heart union`.split(" ");

export const AMHARIC_WORDS = `ሰላም ቤት ውሃ ልጅ እናት አባት ሰው ቀን ሌሊት ዛሬ ነገ ትናንት ስራ ትምህርት ቤተሰብ ከተማ ሀገር መንገድ መኪና ገበያ ዳቦ ቡና ሻይ ወተት ምግብ ፍቅር ጓደኛ መጽሐፍ ብዕር ወረቀት ጊዜ ሰዓት ሳምንት ወር ዓመት ጥሩ መልካም ትልቅ ትንሽ አዲስ አሮጌ ቆንጆ ብዙ ጥቂት ሁሉም እኔ አንተ አንቺ እሱ እሷ እኛ እናንተ እነሱ በላ ጠጣ አየ ሰማ ተናገረ ጻፈ አነበበ ተማረ ሰራ መጣ ሄደ ወደ ላይ ታች ውስጥ ውጭ ፊት ኋላ አዎ አመሰግናለሁ ሐኪም መምህር ተማሪ ገንዘብ ብር ዋጋ ፀሐይ ጨረቃ ኮከብ ዝናብ ነፋስ ተራራ ወንዝ ባህር ዛፍ አበባ ሣር ውሻ ድመት ላም በግ ፍየል ፈረስ አህያ ዶሮ ወፍ አሳ ቀይ ቢጫ አረንጓዴ ሰማያዊ ጥቁር ነጭ አንድ ሁለት ሶስት አራት አምስት ስድስት ሰባት ስምንት ዘጠኝ አስር ቋንቋ ታሪክ ባህል ሙዚቃ ጨዋታ ኳስ ቤተክርስቲያን መስጊድ ሆስፒታል ቢሮ መስኮት በር ወንበር ጠረጴዛ አልጋ ልብስ ጫማ ኮፍያ ዓይን ጆሮ አፍንጫ አፍ እጅ እግር ራስ ልብ ደም ጤና በሽታ መድሃኒት ስልክ ኮምፒውተር ዜና ሬድዮ ቴሌቪዥን ፊልም ፎቶ ደብዳቤ ጥያቄ መልስ ሀሳብ እውነት ውሸት ደስታ ሀዘን ተስፋ ሰላምታ እንኳን ደህና መጣህ ቆይ ተነሳ ተቀመጥ ሩጥ ዝለል ዘምር ሳቅ አልቅስ ተኛ ንቃ ክፈት ዝጋ ስጥ ውሰድ ግዛ ሽጥ ፈልግ አግኝ ጀምር ጨርስ`.split(" ");

const PUNCTUATION = [",", ".", "?", "!", ";", ":"];

export function buildWords(
  source: string[],
  count: number,
  opts: { punctuation: boolean; numbers: boolean },
  rand: (max: number) => number
): string[] {
  const out: string[] = [];
  let capitalizeNext = opts.punctuation;
  for (let i = 0; i < count; i++) {
    let word = source[rand(source.length)];
    if (opts.numbers && rand(8) === 0) word = String(rand(1000));
    if (opts.punctuation) {
      if (capitalizeNext) word = word[0].toUpperCase() + word.slice(1);
      capitalizeNext = false;
      if (rand(6) === 0) {
        const p = PUNCTUATION[rand(PUNCTUATION.length)];
        word += p;
        capitalizeNext = ".?!".includes(p);
      }
    }
    out.push(word);
  }
  return out;
}
