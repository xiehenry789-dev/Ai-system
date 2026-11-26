// Puts the Wizard Meadow icon and name on the Windows .exe
import {createRequire} from 'module';const require=createRequire(process.env.NODE_PATH+'/');
const ResEdit=require('resedit');const fs=require('fs');
const [exePath,icoPath]=process.argv.slice(2);
const exe=ResEdit.NtExecutable.from(fs.readFileSync(exePath),{ignoreCert:true});const res=ResEdit.NtExecutableResource.from(exe);
const ico=ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
for(const g of ResEdit.Resource.IconGroupEntry.fromEntries(res.entries))ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries,g.id,g.lang,ico.icons.map(i=>i.data));
const vi=ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
for(const k of['FileDescription','ProductName','InternalName'])vi.setStringValues({lang:1033,codepage:1200},{[k]:'Wizard Meadow'});
vi.setStringValues({lang:1033,codepage:1200},{OriginalFilename:'Wizard Meadow.exe'});vi.outputToResourceEntries(res.entries);
res.outputResource(exe);fs.writeFileSync(exePath,Buffer.from(exe.generate()));console.log('exe icon set');
