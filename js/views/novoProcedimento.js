import { salvarProcedimento, buscarProcedimento } from "../db.js";
import { resolverFontePagadora, hospitalReconhecido, convenioNecessario, HOSPITAIS_CONHECIDOS, STATUS_PAGAMENTO } from "../fontePagadora.js";
import { escapar, gerarId, agoraISO, hojeISO } from "../util.js";
import { mostrarToast } from "../toast.js";
import { abrirSeletorCBHPM } from "./seletorCBHPM.js";
import { consumirRascunho } from "../draftStore.js";

function ehUnimed(hospital) {
  return (hospital || "").trim().localeCompare("Unimed", undefined, { sensitivity: "base" }) === 0;
}

export async function render(app, params) {
  const idEdicao = params?.id || null;
  const existente = idEdicao ? await buscarProcedimento(idEdicao) : null;
  const rascunho = idEdicao ? null : consumirRascunho();

  const estado = existente
    ? { ...existente, codigos: existente.codigos.map((c) => ({ ...c })) }
    : rascunho
    ? { ...rascunho, codigos: rascunho.codigos.map((c) => ({ ...c })) }
    : {
        id: gerarId(),
        paciente: "",
        hospital: "",
        convenio: "",
        fontePagadora: "",
        carteiraBeneficiario: "",
        data: hojeISO(),
        status: "Pendente",
        origem: "manual",
        observacoes: "",
        codigos: [],
        fotoBlob: null,
        pacote: false,
      };

  const avisos = rascunho?.avisos || [];

  let fotoDataUrl = null;
  if (estado.fotoBlob) {
    fotoDataUrl = await blobParaDataUrl(estado.fotoBlob);
  }

  function desenhar() {
    app.innerHTML = `
      <div class="tela">
        <div class="topo">
          <button class="botao-voltar" id="btn-cancelar">Cancelar</button>
          <h1>${idEdicao ? "Editar Procedimento" : rascunho ? "Confira os Dados" : "Novo Procedimento"}</h1>
        </div>

        ${
          avisos.length
            ? `<div class="aviso-conferencia">
                <strong>⚠️ Confira antes de salvar</strong>
                <ul>${avisos.map((a) => `<li>${escapar(a)}</li>`).join("")}</ul>
              </div>`
            : ""
        }

        <div class="secao-titulo">Foto (opcional)</div>
        <div id="area-foto"></div>

        <div class="secao-titulo">Dados do procedimento</div>

        <div class="campo">
          <label>Paciente</label>
          <input type="text" id="campo-paciente" value="${escapar(estado.paciente)}" placeholder="Nome do paciente">
        </div>

        <div class="campo">
          <label>Hospital</label>
          <input type="text" id="campo-hospital" value="${escapar(estado.hospital)}" placeholder="Hospital">
          <div class="chips">
            ${HOSPITAIS_CONHECIDOS.map((h) => `<button type="button" class="chip" data-hospital="${h}">${h}</button>`).join("")}
          </div>
        </div>

        <div class="campo" id="campo-convenio-wrap" style="display:${convenioNecessario(estado.hospital) ? "block" : "none"}">
          <label>Convênio</label>
          <input type="text" id="campo-convenio" value="${escapar(estado.convenio)}" placeholder="Convênio">
        </div>

        <div class="campo" id="campo-carteira-wrap" style="display:${ehUnimed(estado.hospital) ? "block" : "none"}">
          <label>Carteira do beneficiário</label>
          <input type="text" inputmode="numeric" id="campo-carteira" value="${escapar(estado.carteiraBeneficiario || "")}" placeholder="Número da carteira Unimed">
        </div>

        <div class="campo">
          <label>Fonte pagadora</label>
          <input type="text" id="campo-fonte" value="${escapar(estado.fontePagadora)}" placeholder="Fonte pagadora"
            ${hospitalReconhecido(estado.hospital) ? "readonly" : ""}>
        </div>

        <div id="area-pacote"></div>

        <div class="campo">
          <label>Data</label>
          <input type="date" id="campo-data" value="${estado.data}">
        </div>

        <div class="campo">
          <label>Status</label>
          <div class="segmentado" id="segmentado-status">
            ${STATUS_PAGAMENTO.map((s) => `<button type="button" data-status="${s}" class="${estado.status === s ? "ativo" : ""}">${s}</button>`).join("")}
          </div>
        </div>

        <div class="secao-titulo">Códigos do procedimento</div>
        <div class="lista-codigos" id="lista-codigos"></div>
        <button class="botao-secundario" id="btn-add-codigo" style="margin-top:10px">+ Adicionar código CBHPM</button>

        <div class="secao-titulo">Observações</div>
        <div class="campo">
          <textarea id="campo-observacoes" placeholder="Opcional">${escapar(estado.observacoes)}</textarea>
        </div>

        ${
          estado.textoOcr
            ? `<details class="detalhe-ocr">
                <summary>Ver texto que o app leu da foto (para diagnóstico)</summary>
                <pre>${escapar(estado.textoOcr)}</pre>
              </details>`
            : ""
        }

        <div class="barra-inferior">
          <button class="botao-primario" id="btn-salvar">Salvar procedimento</button>
        </div>
      </div>
    `;

    desenharFoto();
    desenharCodigos();
    desenharPacote();
    ligarEventos();
  }

  function desenharPacote() {
    const area = app.querySelector("#area-pacote");
    if (estado.fontePagadora !== "Tacchimed") {
      area.innerHTML = "";
      return;
    }
    area.innerHTML = `
      <div class="campo">
        <label>Pacote?</label>
        <div class="segmentado" id="segmentado-pacote">
          <button type="button" data-pacote="sim" class="${estado.pacote ? "ativo" : ""}">Sim</button>
          <button type="button" data-pacote="nao" class="${!estado.pacote ? "ativo" : ""}">Não</button>
        </div>
      </div>`;
    area.querySelectorAll("[data-pacote]").forEach((btn) =>
      btn.addEventListener("click", () => {
        estado.pacote = btn.dataset.pacote === "sim";
        desenharPacote();
      })
    );
  }

  function desenharFoto() {
    const area = app.querySelector("#area-foto");
    if (fotoDataUrl) {
      area.innerHTML = `
        <div style="position:relative">
          <img src="${fotoDataUrl}" style="width:100%;border-radius:12px;max-height:220px;object-fit:cover">
          <button id="btn-remover-foto" class="botao-texto" style="position:absolute;top:8px;right:8px;padding:6px 10px">Remover</button>
        </div>`;
      area.querySelector("#btn-remover-foto").addEventListener("click", () => {
        estado.fotoBlob = null;
        fotoDataUrl = null;
        desenharFoto();
      });
    } else {
      area.innerHTML = `
        <label class="botao-secundario" style="display:block;text-align:center">
          📷 Tirar foto ou escolher da galeria
          <input type="file" accept="image/*" id="input-foto" style="display:none">
        </label>`;
      area.querySelector("#input-foto").addEventListener("change", async (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;
        estado.fotoBlob = arquivo;
        fotoDataUrl = await blobParaDataUrl(arquivo);
        desenharFoto();
      });
    }
  }

  function desenharCodigos() {
    const lista = app.querySelector("#lista-codigos");
    if (estado.codigos.length === 0) {
      lista.innerHTML = `<p style="color:var(--cor-texto-secundario);font-size:14px">Nenhum código adicionado ainda.</p>`;
      return;
    }
    lista.innerHTML = estado.codigos
      .map(
        (c, i) => `
      <div class="item-codigo">
        <div class="codigo">${c.codigo}</div>
        <div class="descricao">${escapar(c.descricaoOficial)}</div>
        <div class="linha-controles">
          <div class="stepper">
            <button type="button" data-dec="${i}">−</button>
            <span>${c.quantidade}</span>
            <button type="button" data-inc="${i}">+</button>
          </div>
          <button type="button" class="botao-remover" data-remover="${i}">Remover</button>
        </div>
      </div>`
      )
      .join("");

    lista.querySelectorAll("[data-inc]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.inc);
        estado.codigos[i].quantidade = Math.min(20, estado.codigos[i].quantidade + 1);
        desenharCodigos();
      })
    );
    lista.querySelectorAll("[data-dec]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.dec);
        estado.codigos[i].quantidade = Math.max(1, estado.codigos[i].quantidade - 1);
        desenharCodigos();
      })
    );
    lista.querySelectorAll("[data-remover]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.remover);
        estado.codigos.splice(i, 1);
        desenharCodigos();
      })
    );
  }

  function atualizarFonteAutomatica() {
    const resolvido = resolverFontePagadora(estado.hospital, estado.convenio);
    if (resolvido) estado.fontePagadora = resolvido;
  }

  function ligarEventos() {
    app.querySelector("#btn-cancelar").addEventListener("click", () => history.back());

    app.querySelector("#campo-paciente").addEventListener("input", (e) => (estado.paciente = e.target.value));

    const campoHospital = app.querySelector("#campo-hospital");
    campoHospital.addEventListener("input", (e) => {
      estado.hospital = e.target.value;
      atualizarFonteAutomatica();
      redesenharCamposDependentes();
    });
    app.querySelectorAll("[data-hospital]").forEach((btn) =>
      btn.addEventListener("click", () => {
        estado.hospital = btn.dataset.hospital;
        atualizarFonteAutomatica();
        desenhar();
      })
    );

    const campoConvenio = app.querySelector("#campo-convenio");
    if (campoConvenio) {
      campoConvenio.addEventListener("input", (e) => {
        estado.convenio = e.target.value;
        atualizarFonteAutomatica();
        redesenharCamposDependentes();
      });
    }

    const campoCarteira = app.querySelector("#campo-carteira");
    if (campoCarteira) {
      campoCarteira.addEventListener("input", (e) => (estado.carteiraBeneficiario = e.target.value));
    }

    app.querySelector("#campo-fonte").addEventListener("input", (e) => {
      estado.fontePagadora = e.target.value;
      desenharPacote();
    });
    app.querySelector("#campo-data").addEventListener("input", (e) => (estado.data = e.target.value));
    app.querySelector("#campo-observacoes").addEventListener("input", (e) => (estado.observacoes = e.target.value));

    app.querySelectorAll("#segmentado-status button").forEach((btn) =>
      btn.addEventListener("click", () => {
        estado.status = btn.dataset.status;
        app.querySelectorAll("#segmentado-status button").forEach((b) => b.classList.toggle("ativo", b === btn));
      })
    );

    app.querySelector("#btn-add-codigo").addEventListener("click", () => {
      abrirSeletorCBHPM((selecionado) => {
        estado.codigos.push({
          codigo: selecionado.codigo,
          descricaoOficial: selecionado.descricao,
          quantidade: 1,
          identificadoAutomaticamente: false,
        });
        desenharCodigos();
      });
    });

    app.querySelector("#btn-salvar").addEventListener("click", salvar);
  }

  function redesenharCamposDependentes() {
    const wrapConvenio = app.querySelector("#campo-convenio-wrap");
    wrapConvenio.style.display = convenioNecessario(estado.hospital) ? "block" : "none";

    const wrapCarteira = app.querySelector("#campo-carteira-wrap");
    wrapCarteira.style.display = ehUnimed(estado.hospital) ? "block" : "none";

    const campoFonte = app.querySelector("#campo-fonte");
    campoFonte.value = estado.fontePagadora;
    campoFonte.readOnly = hospitalReconhecido(estado.hospital);

    desenharPacote();
  }

  async function salvar() {
    estado.paciente = estado.paciente.trim();
    estado.hospital = estado.hospital.trim();
    estado.fontePagadora = estado.fontePagadora.trim();
    estado.carteiraBeneficiario = (estado.carteiraBeneficiario || "").trim();

    if (!estado.paciente) return mostrarToast("Informe o paciente.");
    if (!estado.hospital) return mostrarToast("Informe o hospital.");
    if (!estado.fontePagadora) return mostrarToast("Informe a fonte pagadora.");
    if (estado.codigos.length === 0) return mostrarToast("Adicione ao menos um código de procedimento.");

    estado.atualizadoEm = agoraISO();
    if (!estado.criadoEm) estado.criadoEm = agoraISO();
    estado.pacote = estado.fontePagadora === "Tacchimed" ? estado.pacote : null;

    const { textoOcr, avisos: _avisos, ...paraSalvar } = estado;
    await salvarProcedimento(paraSalvar);
    mostrarToast("Procedimento salvo.");
    location.hash = "#/procedimentos";
  }

  desenhar();
}

function blobParaDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
